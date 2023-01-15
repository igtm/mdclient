import mermaid from "/pages/js/mermaid.esm.min.mjs";
import init, { convert_md2html, get_heading_li } from "/pages/pkg/wasm.js";
mermaid.initialize({ startOnLoad: true });

const LIST_API_URL = (owner, repo, branch) =>
  `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
const GET_API_URL = (owner, repo, path) =>
  `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

function withAuthHeader() {
  const oauthAccessToken = localStorage.getItem("github-oauth-access-token");
  if (!oauthAccessToken) {
    return {};
  }
  return {
    Authorization: `Bearer ${oauthAccessToken}`,
  };
}

function get_object(e) {
  const owner = e.target.dataset.owner;
  const repo = e.target.dataset.repo;
  const dir = e.target.dataset.dir;
  const path = dir + e.target.dataset.path;
  const content = document.getElementById("content");
  const index = document.getElementById("index");
  bar.animate(0.7);
  Promise.all([
    // fetch
    window
      .fetch(GET_API_URL(owner, repo, path), {
        method: "GET",
        headers: {
          ...withAuthHeader(),
        },
      })
      .then((res) => {
        if (!res.ok) {
          console.error("res.ok:", res.ok);
          console.error("esponse.status:", res.status);
          console.error("esponse.statusText:", res.statusText);
          throw new Error(res.statusText);
        }

        bar.animate(1, { duration: 800 });
        setTimeout(() => {
          bar.set(0);
        }, 1000);
        return res.json();
      })
      .then((d) => decodeURIComponent(escape(window.atob(d.content))))
      .catch((e) => {
        console.error(e);
        bar.animate(0);
        alert(e.message);
      }),

    // wasm init
    init(),
  ]).then(([body]) => {
    const html = convert_md2html(body);
    const heading_html = get_heading_li(body);
    content.dataset.owner = owner;
    content.dataset.repo = repo;
    content.dataset.path = path;
    content.innerHTML = html;
    index.innerHTML = heading_html;

    // syntax highlight (highlight.js)
    hljs.highlightAll();
  });
}

function onGithubKeydown(e) {
  if (e.keyCode === 13) {
    console.log("enter");

    // clear referer hash
    location.hash = "";

    const githubOwner = document.getElementById("github-owner");
    const githubRepo = document.getElementById("github-repo");
    const githubDir = document.getElementById("github-dir");
    const githubBranch = document.getElementById("github-branch");

    const githubOwnerValue = githubOwner.value.replace("/");
    const githubRepoValue = githubRepo.value.replace("/");
    const githubDirValue = (() => {
      if (githubDir.value === "" || githubDir.value === "/") {
        return "";
      }
      if (githubDir.value.lastIndexOf("/") !== githubDir.value.length - 1) {
        return githubDir.value + "/";
      }
      return githubDir.value;
    })();
    const githubBranchValue = githubBranch.value;

    localStorage.setItem("github-owner", githubOwnerValue);
    localStorage.setItem("github-repo", githubRepoValue);
    localStorage.setItem("github-dir", githubDirValue);
    localStorage.setItem("github-branch", githubBranchValue);

    if (
      githubOwnerValue !== "" &&
      githubRepoValue !== "" &&
      githubBranchValue !== ""
    ) {
      get_list(
        githubOwnerValue,
        githubRepoValue,
        githubDirValue,
        githubBranchValue
      );
    } else {
      alert("owner/repo/branch is required");
    }
  }
}

function get_github_splitted_from_url(url) {
  if (is_repo_page(url)) {
    const githubURL = new URL(url);
    return githubURL.pathname.split("/").slice(1);
  } else {
    return ["", ""];
  }
}
function is_repo_page(url) {
  if (!url) {
    return false;
  }
  const u = new URL(url);
  if (u.hostname !== "github.com") {
    return false;
  }
  if (
    u.pathname.indexOf("/pulls") === 0 ||
    u.pathname.indexOf("/issues") === 0 ||
    u.pathname.indexOf("/codespaces") === 0 ||
    u.pathname.indexOf("/marketplace") === 0 ||
    u.pathname.indexOf("/explore") === 0 ||
    u.pathname.indexOf("/topics") === 0 ||
    u.pathname.indexOf("/notifications") === 0 ||
    u.pathname.indexOf("/new") === 0 ||
    u.pathname.indexOf("/organizations") === 0 ||
    u.pathname.indexOf("/users") === 0 ||
    u.pathname.indexOf("/settings") === 0 ||
    u.pathname.indexOf("/sponsors") === 0 ||
    u.pathname.indexOf("/account") === 0 ||
    u.pathname.indexOf("/search") === 0
  ) {
    return false;
  }
  return (u.pathname.match(/\//g) || []).length >= 2;
}
function get_branch_from_url(splittedPath) {
  if (splittedPath.length >= 4) {
    if (splittedPath[2] === "tree" || splittedPath[2] === "blob") {
      return splittedPath[3];
    }
  }
  return "";
}
function get_dir_from_url(splittedPath) {
  if (splittedPath[2] === "tree" && splittedPath.length >= 5) {
    return splittedPath.slice(4).join("/") + "/";
  }
  if (splittedPath[2] === "blob" && splittedPath.length >= 6) {
    return splittedPath.slice(4, splittedPath.length - 1).join("/") + "/";
  }
  return "";
}

window.addEventListener(
  "DOMContentLoaded",
  () => {
    const githubOwner = document.getElementById("github-owner");
    const githubRepo = document.getElementById("github-repo");
    const githubDir = document.getElementById("github-dir");
    const githubBranch = document.getElementById("github-branch");
    // listen "enter" event
    githubOwner.onkeydown = onGithubKeydown;
    githubRepo.onkeydown = onGithubKeydown;
    githubDir.onkeydown = onGithubKeydown;
    githubBranch.onkeydown = onGithubKeydown;
    // retrieve value
    const params = new URLSearchParams(location.hash.replace("#", "?"));
    const url = params.get("url");
    if (is_repo_page(url)) {
      // retrieve value from queryparameters (optional)
      const splittedPath = get_github_splitted_from_url(url);
      githubOwner.value = splittedPath[0];
      githubRepo.value = splittedPath[1];
      githubDir.value = get_dir_from_url(splittedPath);
      githubBranch.value = get_branch_from_url(splittedPath) || "master";
    } else {
      // retrieve value from localstorage
      githubOwner.value = localStorage.getItem("github-owner");
      githubRepo.value = localStorage.getItem("github-repo");
      githubDir.value = localStorage.getItem("github-dir");
      githubBranch.value = localStorage.getItem("github-branch") || "master";
    }

    // get list
    if (
      githubOwner.value !== "" &&
      githubRepo.value !== "" &&
      githubBranch.value !== ""
    ) {
      get_list(
        githubOwner.value,
        githubRepo.value,
        githubDir.value,
        githubBranch.value
      );
    }

    // replace private relative image to base64 img
    onMutationObserver();
  },
  false
);

// progressbar.js
var bar = new ProgressBar.Line(".top-loading-bar", {
  easing: "easeInOut",
  color: "#15B5B0",
  strokeWidth: 0.15,
  duration: 3000,
});

function get_list(owner, repo, dir, branch) {
  bar.animate(0.7);
  window
    .fetch(LIST_API_URL(owner, repo, branch), {
      method: "GET",
      headers: {
        ...withAuthHeader(),
      },
    })
    .then((res) => {
      if (!res.ok) {
        console.error("res.ok:", res.ok);
        console.error("esponse.status:", res.status);
        console.error("esponse.statusText:", res.statusText);
        if (res.status === 404) {
          throw new Error("repository not found");
        }
        throw new Error(res.statusText);
      }

      bar.animate(1, { duration: 800 });
      setTimeout(() => {
        bar.set(0);
      }, 1000);
      return res.json();
    })
    .then((data) => {
      const paths = data.tree
        // only target dir
        .filter((d) => dir === "" || d.path.indexOf(dir) === 0)
        // only .md
        .filter((d) => d.path.indexOf(".md") === d.path.length - 3)
        .map((d) => {
          if (dir === "") {
            return d.path;
          }
          return d.path.substring(dir.length);
        });

      const recursivePathResolver = (acc, path, originalPath) => {
        if (path.indexOf("/") === -1) {
          return [
            ...acc,
            {
              path: originalPath,
              name: path,
              is_dir: false,
              children: [],
            },
          ];
        }
        const path_split = path.split("/");
        const name = path_split.shift();
        const remainPath = path_split.join("/");
        const sameNameIdx = acc.findIndex((d) => d.name === name);
        if (sameNameIdx !== -1) {
          acc[sameNameIdx].children = recursivePathResolver(
            acc[sameNameIdx].children,
            remainPath,
            originalPath
          );
          return acc;
        } else {
          return [
            ...acc,
            {
              path: originalPath,
              name,
              is_dir: true,
              children: recursivePathResolver([], remainPath, originalPath),
            },
          ];
        }
      };

      return paths.reduce((acc, p) => {
        return recursivePathResolver(acc, p, p);
      }, []);
    })
    .then((tree) => {
      const recursiveUl = (sidebar, d) => {
        if (d.is_dir) {
          const li = document.createElement("li");
          const ul = document.createElement("ul");
          li.innerText = d.name + "/";
          li.dataset.owner = owner;
          li.dataset.repo = repo;
          li.dataset.dir = dir;
          li.dataset.path = d.path;
          li.onclick = get_object;
          sidebar.appendChild(li);
          d.children.reduce(recursiveUl, ul);
          sidebar.appendChild(ul);
          return sidebar;
        } else {
          const li = document.createElement("li");
          li.innerText = d.name;
          li.dataset.owner = owner;
          li.dataset.repo = repo;
          li.dataset.dir = dir;
          li.dataset.path = d.path;
          li.onclick = get_object;
          li.className = "file";
          sidebar.appendChild(li);
          return sidebar;
        }
      };

      const sidebar = document.getElementById("sidebar");
      sidebar.innerHTML = "";

      // updated element
      tree.reduce(recursiveUl, sidebar);
    })
    .catch((e) => {
      console.error(e);
      bar.animate(0);
      alert(e);
    });
}

function get_raw_content(owner, repo, path) {
  // fetch
  return window
    .fetch(GET_API_URL(owner, repo, path), {
      method: "GET",
      headers: {
        ...withAuthHeader(),
      },
    })
    .then((res) => {
      if (!res.ok) {
        console.error("res.ok:", res.ok);
        console.error("esponse.status:", res.status);
        console.error("esponse.statusText:", res.statusText);
        throw new Error(res.statusText);
      }
      return res.json();
    })
    .then((d) => d.content)
    .catch((e) => {
      console.error(e);
      alert(e.message);
    });
}

function onMutationObserver() {
  const content = document.getElementById("content");
  // (変更を監視する) オブザーバーのオプション
  const config = { attributes: false, childList: true, subtree: false };

  // 変更が発見されたときに実行されるコールバック関数
  const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        const imgs = content.getElementsByTagName("img");
        Array.prototype.map.call(imgs, (img) => {
          const src = img.getAttribute("src");
          if (is_relative_url(src)) {
            get_raw_content(
              content.dataset.owner,
              content.dataset.repo,
              get_abspath_from_relative(content.dataset.path, src)
            ).then((b64) => {
              img.src = `data:${get_mimetype_from_ext(src)};base64,${b64}`;
            });
          }
        });

        const pres = content.getElementsByTagName("pre");
        Array.prototype.map.call(pres, (pre) => {
          if (pre.getAttribute("lang") === "mermaid") {
            const id = "mmd" + Math.round(Math.random() * 10000);
            pre.id = id;
            const parent = pre.parentNode;
            const next = pre.nextSibling;
            const svg = mermaid.render(id, pre.textContent);
            const div = document.createElement("div");
            div.innerHTML = svg;
            parent.insertBefore(div, next);
          }
        });
      }
    }
  };

  // コールバック関数に結びつけられたオブザーバーのインスタンスを生成
  const observer = new MutationObserver(callback);

  // 対象ノードの設定された変更の監視を開始
  observer.observe(content, config);
}

function is_relative_url(url) {
  return !(
    url.indexOf("http://") === 0 ||
    url.indexOf("https://") === 0 ||
    url.indexOf("//") === 0 ||
    url.indexOf("data:") === 0
  );
}

function get_abspath_from_relative(basepath, relativepath) {
  const pathname = new URL(relativepath, `https://example.com/${basepath}`)
    .pathname;
  // first slash should be removed here
  if (pathname.indexOf("/") === 0) {
    return pathname.substring(1);
  }
  return pathname;
}

function get_mimetype_from_ext(filename) {
  if (filename.indexOf(".jpg") !== -1 || filename.indexOf(".jpeg") !== -1) {
    return "image/jpeg";
  } else if (filename.indexOf(".png") !== -1) {
    return "image/png";
  } else if (filename.indexOf(".gif") !== -1) {
    return "image/gif";
  } else {
    return "image/jpeg";
  }
}

/* resize github input form */
function resizeGitubInputForm() {
  document.querySelectorAll(".auto-resize").forEach((element) => {
    if (element.value === "") {
      element.parentNode.dataset.value = element.placeholder;
    } else {
      element.parentNode.dataset.value = element.value;
    }
  });
}

function listenResizeGitubInputForm() {
  document.querySelectorAll(".auto-resize").forEach((element) => {
    element.oninput = (e) => {
      if (e.target.value === "") {
        e.target.parentNode.dataset.value = e.target.placeholder;
      } else {
        e.target.parentNode.dataset.value = e.target.value;
      }
    };
  });
}

window.addEventListener(
  "DOMContentLoaded",
  () => {
    listenResizeGitubInputForm();
    resizeGitubInputForm();
  },
  false
);
