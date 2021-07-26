"use strict";

function applyConfiguration(title, button_color) {
  const state = {
    view: "trying",
    dots: "",
    completeTimer: null,
    targetElem: document.querySelector(".content"),
    configurationStatus: "not_configured",
    completed: false,
    ssid: document.getElementById("ssid").getAttribute("value"),
    title: title
  }

  function runGetStatus() {
    setTimeout(getStatus, 1000);
  }

  function getStatus() {
    fetch("/api/v1/configuration/status")
      .then(resp => resp.json())
      .then(handleStatusResponse)
      .catch(handleNetworkErrorResponse);
  }

  function handleStatusResponse(status) {
    switch (status) {
      case "not_configured":
        state.dots = state.dots + ".";
        render(state);
        break;
      case "good":
        if (!status.completed) {
          state.view = "configurationGood";
          state.configurationStatus = status;
          state.completeTimer = setTimeout(complete, 60000);
          render(state);
        }
        break;
      case "bad":
        state.view = "configurationBad";
        state.configurationStatus = status;
        render(state);
        break;
    }
  }

  function handleNetworkErrorResponse(e) {
    state.dots = state.dots + ".";
    render(state);
  }

  function createCompleteLink({ targetElem, view }) {
    const button = document.createElement("button");
    var btnClass = "btn-primary";
    var btnText = "Ok";

    if (view === "configurationBad") {
      btnClass = "btn-danger";
      btnText = "Absvhließen ohne Prüfung";
    }

    if (view != "configurationBad") {
      button.style.backgroundColor = button_color;
    }

    button.classList.add("btn");
    button.classList.add(btnClass);
    button.addEventListener("click", handleCompleteClick);
    button.innerHTML = btnText;

    targetElem.appendChild(button);
  }

  function handleCompleteClick(e) {
    if (state.completeTimer) {
      clearTimeout(state.completeTimer);
      state.completeTimer = null;
    }
    complete();
  }

  function view({ view, title, dots, ssid }) {
    switch (view) {
      case "trying":
        return [`
        <p>Bitte warten, die Einstellungen werden geprüft.</p>

        <p>${dots}</p>

        `, runGetStatus
        ];
      case "configurationGood":
        return [`
        <p>Erfolgreich verbunden!</p>

        <p>Clicke "Ok" zum Beenden der Konfiguration.</p>
        <p>In 60 Sekunden wird automatisch beendet..</p>
        `, createCompleteLink];
      case "configurationBad":
        return [`
        <p>Verbinden fehlgeschlagen.</p>

        <p>Stellen Sie sicher, dass:</p>
        <ul>
          <li>Eingegebene Passwörter korrekt sind</li>
          <li>Mindestens ein angegebenes Netzwerk in Reichweite ist</li>
        </ul>

        <p>Prüfen Sie Ihre Einstellungen und versuchen Sie es erneut.</p>
        <a class="btn btn-primary" href="/">Konfiguration</a>
        `, createCompleteLink];
      case "complete":
        return ["Konfiguration abgeschlossen.", null];
    }
  }

  function complete() {
    fetch("/api/v1/complete")
      .then(resp => {
        state.view = "complete";
        render(state);
      });
  }

  function render(state) {
    const [innerHTML, action] = view(state);
    state.targetElem.innerHTML = innerHTML;

    if (action) {
      action(state);
    }
  }

  fetch("/api/v1/apply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  }).then(resp => runGetStatus());
}
