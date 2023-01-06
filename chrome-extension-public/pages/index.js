import init, { convert_md2html, get_heading_li } from "/pages/pkg/wasm.js";

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
        return res.json();
      })
      .then((d) => decodeURIComponent(escape(window.atob(d.content))))
      .catch((e) => {
        console.error(e);
        alert(e.message);
      }),

    // wasm init
    init(),
  ]).then(([body]) => {
    const html = convert_md2html(body);
    const heading_html = get_heading_li(body);
    content.innerHTML = html;
    index.innerHTML = heading_html;
  });
}

function onGithubKeydown(e) {
  if (e.keyCode === 13) {
    console.log("enter");

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
    // retrieve value from localstorage
    githubOwner.value = localStorage.getItem("github-owner");
    githubRepo.value = localStorage.getItem("github-repo");
    githubDir.value = localStorage.getItem("github-dir");
    githubBranch.value = localStorage.getItem("github-branch") || "master";

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
  },
  false
);

function get_list(owner, repo, dir, branch) {
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
      alert(e);
    });
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
