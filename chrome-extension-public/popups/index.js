chrome.tabs.query({ active: true, currentWindow: true }, (e) => {
  const url = e[0].url;
  const withGithubUrl = document.getElementById("with-github-url");
  const withGithubUrlA = document.getElementById("with-github-url-a");
  if (!url || !is_repo_page(url)) {
    withGithubUrl.classList.add("hide");
  } else {
    withGithubUrlA.href = `/pages/index.html#url=${url}`;
    withGithubUrl.classList.remove("hide");
  }
});

// FIXME: better way?
function is_repo_page(url) {
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
