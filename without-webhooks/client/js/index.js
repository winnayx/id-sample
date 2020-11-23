let verificationIntentId;

/*
 * Calls the server to retrieve the identity verification start url
 *
 */
const startIdentityVerification = function (returnUrl) {
  return fetch("/create-verification-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ returnUrl }),
  })
    .then(function (result) {
      console.log("function called, ret url: ", returnUrl);
      return result.json();
    })
    .then(function (data) {
      if (
        data &&
        data.id &&
        data.next_action &&
        data.next_action.redirect_to_url
      ) {
        verificationIntentId = data.id;
        return data.next_action.redirect_to_url;
      }
    });
};

const iframeContainerTemplate = `
  <div class="modal-container">
    <div class="stripe-identity-verification-iframe">
      <div class="iframe-header">
        <span class="iframe-title">Verify your identity</span>
        <img class="iframe-close" src="../media/cancel.svg">
      </div>
    </div>
    <div class="modal-backdrop"></div>
  </div>
`;

const closeIframe = function () {
  const iframeContainer = document.querySelector(
    ".stripe-identity-verification-iframe"
  );
  const modalBackdrop = document.querySelector(".modal-backdrop");
  iframeContainer.classList.add("closing");
  modalBackdrop.classList.add("closing");

  window.setTimeout(function () {
    const modalContainer = document.querySelector(".modal-container");
    if (modalContainer) {
      modalContainer.parentNode.removeChild(modalContainer);
    }
  }, 300);
};

const openIframe = function (url) {
  const iframePlaceholder = document.createElement("div");
  document.body.appendChild(iframePlaceholder);
  iframePlaceholder.outerHTML = iframeContainerTemplate;
  const iframeContainer = document.querySelector(
    ".stripe-identity-verification-iframe"
  );
  const iframe = document.createElement("iframe");
  iframe.setAttribute("allow", "camera; microphone");
  iframe.src = url;
  iframeContainer.appendChild(iframe);

  const closeButton = document.querySelector(".iframe-close", true);
  closeButton.addEventListener("click", closeIframe);
  const modalBackdrop = document.querySelector(".modal-backdrop");
  modalBackdrop.addEventListener("click", closeIframe);

  return iframe;
};

const startButton = document.getElementById("create-verification-intent");
startButton.addEventListener("click", function () {
  console.log("verify me clicked");
  startIdentityVerification().then(function (url) {
    openIframe(url);
  });
});

const newPageLink = document.getElementById(
  "create-verification-intent-new-page"
);
newPageLink.addEventListener("click", function () {
  startIdentityVerification("/next-step").then(function (url) {
    // redirect the user to the verification flow
    window.open(url, "_blank");
  });
});

const resizeIframe = function (height) {
  const iframeContainer = document.querySelector(
    ".stripe-identity-verification-iframe"
  );
  iframeContainer.style.height = `${height}px`;
};

const handleIframeMessage = function (event) {
  const data = event.data;
  if (data) {
    // console.log('%c data', 'color: #b0b', data);
    if (data.type === "load") {
      // could also show a custom loading screen until this event fires
    } else if (data.type === "success") {
      window.setTimeout(() => {
        closeIframe();
        if (verificationIntentId) {
          window.location.href = `/next-step?verification_intent_id=${verificationIntentId}`;
        }
      }, 1600);
    } else if (data.type === "error") {
      console.warn("Oops, something went wrong.");
    }
  }
};
window.addEventListener("message", handleIframeMessage);
