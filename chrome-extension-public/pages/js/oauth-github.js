window.addEventListener(
  "DOMContentLoaded",
  () => {
    const oauthGithubSignIn = document.getElementById("github-oauth-signin");
    const oauthGithubChangePermission = document.getElementById(
      "github-oauth-change-permission"
    );
    oauthGithubSignIn.onclick = () => {
      github_oauth2().catch((e) => {
        console.error(e);
        alert(e);
      });
    };
    oauthGithubChangePermission.onclick = () => {
      window.open(
        `https://github.com/settings/connections/applications/${GithubOauthAppClientID}`,
        "_blank"
      );
    };

    // check signin status instantly
    if (localStorage.getItem("github-oauth-access-token")) {
      document.documentElement.setAttribute("data-github-signedin", "true");
      // check signin status precisely
      window
        .fetch("https://api.github.com/users/codertocat", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "github-oauth-access-token"
            )}`,
          },
        })
        .then((res) => {
          if (!res.ok) {
            console.error("res.ok:", res.ok);
            console.error("esponse.status:", res.status);
            console.error("esponse.statusText:", res.statusText);
            if (res.status === 401) {
              document.documentElement.setAttribute("data-github-signedin", "");
              localStorage.setItem("github-oauth-access-token", "");
            }
            throw new Error(res.statusText);
          }
          return res.json();
        })
        .then((data) => {
          console.log(data);
        });
    }
  },
  false
);

function github_oauth2() {
  // https://docs.github.com/ja/developers/apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
  const GithubOauthCallbackURL = `https://${ChromeExtensionID}.chromiumapp.org/callback`;
  const scope = "repo";
  const state = Math.random().toString(32).substring(2);

  return new Promise((resolve, reject) => {
    try {
      chrome.identity.launchWebAuthFlow(
        {
          interactive: true,
          url: `https://github.com/login/oauth/authorize?client_id=${GithubOauthAppClientID}&redirect_uri=${GithubOauthCallbackURL}&scope=${scope}&state=${state}`,
        },
        (callbackURL) => {
          console.log(callbackURL);
          if (!callbackURL) {
            localStorage.setItem("github-oauth-access-token", "");
            throw new Error("callbackURL is undefined");
          }
          const url = new URL(callbackURL);
          const token = url.searchParams.get("code");
          // access_token
          window
            .fetch(
              `https://github.com/login/oauth/access_token?client_id=${GithubOauthAppClientID}&redirect_uri=${GithubOauthCallbackURL}&code=${token}&client_secret=${GithubOauthAppClientSecret}`,
              {
                method: "POST",
                headers: {
                  Accept: "application/json",
                },
              }
            )
            .then((res) => {
              if (!res.ok) {
                console.error("res.ok:", res.ok);
                console.error("esponse.status:", res.status);
                console.error("esponse.statusText:", res.statusText);
                throw new Error(res.statusText);
              }
              return res.json();
            })
            .then((data) => {
              console.log(data);
              // https://docs.github.com/ja/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation#token-expired-due-to-lack-of-use
              // 使用されないために期限切れになるトークン
              // GitHub では、1 年間使用されていない OAuth トークンまたはpersonal access tokenを自動的に取り消します。
              localStorage.setItem(
                "github-oauth-access-token",
                data.access_token
              );
              document.documentElement.setAttribute(
                "data-github-signedin",
                "true"
              );
              resolve(data.access_token);
            })
            .catch((e) => {
              console.error(e);
              reject(e);
            });
        }
      );
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}
