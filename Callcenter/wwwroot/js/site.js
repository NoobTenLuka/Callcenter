﻿"use strict";
var connection = new signalR.HubConnectionBuilder().withUrl("/Hub").withAutomaticReconnect().build();

function startConnection() {
    connection.start().then(function () {
    }).catch(function (err) {
        return console.error(err.toString());
    });
    connection.on("SaveOK", function (data) {
        const requestFinish = document.getElementById('requestFinish');
        const requestForm = document.getElementById('requestForm');
        if (requestFinish && requestFinish != undefined && requestFinish != null && requestForm && requestForm != undefined && requestForm != null) {
            document.getElementById('rftel').innerHTML = data.phone;
            document.getElementById('rfzip').innerHTML = data.zip;
            document.getElementById('rfreq').innerHTML = data.request;
            requestForm.classList.add("non-visible");
            requestFinish.classList.remove("non-visible");
            setTimeout(function () {
                requestFinish.classList.add("non-visible");
                requestForm.classList.remove("non-visible");
            }, 4000);
        }
    });
    connection.on("Error", function (data) {
        ShowErrorMsg(data, 4000);
    });
    connection.on("filldata", function (data) {
        const id = document.getElementById('id')
        if (id && id != undefined && id != null) {
            id.value = data.id;
        }
        const phone = document.getElementById('phone')
        if (phone && phone != undefined && phone != null) {
            phone.value = data.phone;
        }
        const zip = document.getElementById('zip')
        if (zip && zip != undefined && zip != null) {
            zip.value = data.zip;
        }
        const radios = document.getElementsByName("request");
        if (radios && radios != undefined && radios != null) {
            for (var i = 0; i < radios.length; i++) {
                radios[i].checked = (radios[i].value == data.request);
            }
        }
    });
    connection.on("ItemChange", function (object) {
        //console.log(object);
        var bisherigesObject = document.getElementById(object.id);
        if (bisherigesObject !== null) {
            if (object.deleted) {
                bisherigesObject.parentElement.removeChild(bisherigesObject);
            } else if (object.marked) {
                if (!bisherigesObject.classList.contains("marked")) {
                    bisherigesObject.classList.add("other");
                }
            } else {
                bisherigesObject.classList.remove("other");
            }
            return;
        }
        object.timestamp = new Date(object.timestamp);

        switch (object.request) {
            case -1:
                object.request = "Fehler";
                break;
            case 1:
                object.request = "Einkäufe";
                break;
            case 2:
                object.request = "Haustiere";
                break;
            case 3:
                object.request = "Reparaturen";
                break;
            default:
                object.request = "Sonstiges";
                break;
        }
        object.cstring = object.marked ? "other" : "";

        $("#entries").find('tbody')
            .append($('<tr  id="' + object.id + '" class="' + object.cstring + '">')
                .append($('<td>')
                    .append(object.timestamp.toLocaleString("de"))
                )
                .append($('<td>')
                    .append(object.phone)
                )
                .append($('<td>')
                    .append(object.request)
                )
                .append($('<td>')
                    .append($('<button class="btn btn-secondary btn-sm btn-block" onclick="MarkItem(\'' + object.id + '\')">')
                        .append('<i class="fas fa-user-edit" title="In Bearbeitung nehmen">')
                    )
                )
                .append($('<td>')
                    .append($('<button class="btn btn-secondary btn-sm btn-block" onclick="DelItem(\'' + object.id + '\')">')
                        .append('<i class="fas fa-thumbs-up" title="Fertigstellen">')
                    )
                )
        );
        const footfield = document.getElementById("footfield");
        const InfoWindow = document.getElementById("InfoWindow");
        footfield.classList.add("non-visible");
        InfoWindow.classList.remove("non-visible");
        setTimeout(function () {
            InfoWindow.classList.add("non-visible");
            footfield.classList.remove("non-visible");
        }, 1500);
    });
}
startConnection();
function MarkItem(elmid) {
    const element = document.getElementById(elmid);
    if (element.classList.contains("other")) {
        const isConfirmed = confirm("Dieser Eintrag wird bereits bearbeitet. Bitte bestätigen Sie, dass sie diesen Eintrag übernehmen möchten.");
        if (!isConfirmed) {
            return;
        }
        if (element.classList.contains("other")) {
            element.classList.remove("other");
        }
    }
    if (!element.classList.contains("marked")) {
        Array.from(document.getElementsByClassName("marked")).forEach(elm => {
            connection.invoke("FreeEntry", elm.id);
            Array.from(elm.getElementsByClassName("fa-times")).forEach(itm => {
                itm.classList.add("fa-user-edit");
                itm.classList.remove("fa-times");
            });
            elm.classList.remove("marked");
        });
        element.classList.add("marked");
        Array.from(element.getElementsByClassName("fa-user-edit")).forEach(itm => {
            itm.classList.add("fa-times");
            itm.classList.remove("fa-user-edit");
        });
        connection.invoke("MarkEntry", elmid);
    } else {
        element.classList.remove("marked");
        Array.from(element.getElementsByClassName("fa-times")).forEach(itm => {
            itm.classList.add("fa-user-edit");
            itm.classList.remove("fa-times");
        });
        connection.invoke("FreeEntry", elmid);
        document.getElementById('id').value = "";
        document.getElementById('phone').value = "";
        document.getElementById('zip').value = "";
        const radios = document.getElementsByName("request");
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                radios[i].checked = false;
            }
        }
    }
}
function DelItem(elmid) {
    var element = document.getElementById(elmid);
    if (element.classList.contains("marked")) {
        connection.invoke("DeleteEntry", elmid);
        document.getElementById('id').value = "";
        document.getElementById('phone').value = "";
        document.getElementById('zip').value = "";
        const radios = document.getElementsByName("request");
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                radios[i].checked = false;
            }
        }
    } else {
        alert("Um den Eintrag abschließen zu können, müssen Sie ihn zunächst bearbeiten.");
    }
}
function ValidateAll() {
    if (!validatePhone()) {
        ShowErrorMsg("Telefonnummer ist nicht korrekt", 2000);
        return true;
    }
    if (!validateZip()) {
        ShowErrorMsg("Postleitzahl ist nicht korrekt", 2000);
        return true;
    }
    if (!validateAuswahl()) {
        ShowErrorMsg("Auswahl ist nicht korrekt", 2000);
        return true;
    }
    return false;
}
function AddItem() {
    if (ValidateAll()) {
        return false;
    }
    var request;
    const radios = document.getElementsByName("request");
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            request = radios[i].value;
        }
    }
    connection.invoke("AddOrModifyEntry",
        document.getElementById('id').value,
        document.getElementById('phone').value,
        document.getElementById('zip').value,
        request
    );
    var id = document.getElementById('id').value;
    if (id && id != undefined && id != null && id !== "") {
        var element = document.getElementById(id);
        var array = Array.from(element.getElementsByClassName("btn-secondary"));
        if (array && array != undefined && array != null) {
            array.forEach(itm => {
                itm.classList.remove("btn-secondary");
                itm.classList.add("btn-success");
            });
        }
    }
    return false;
}
function validatePhone() {
    const phone = document.getElementById("phone");
    if (phone && phone != undefined && phone != null) {
        var rgx = new RegExp("^(0049\\d{5,}|0[1-9]\\d{4,}|\\+49\\d{5,})$");
        if (phone.value.match(rgx)) {
            phone.classList.remove("invalid");
            return true;
        } else {
            phone.classList.add("invalid");
        }
    }
    return false;
}
function validateZip() {
    const zip = document.getElementById("zip");
    if (zip && zip != undefined && zip != null) {
        var rgx = new RegExp("^\\d{5}$");
        if (zip.value.match(rgx)) {
            zip.classList.remove("invalid");
            return true;
        } else {
            zip.classList.add("invalid");
        }
    }
    return false;
}
function validateAuswahl() {
    const radios = document.getElementsByName("request");
    var ok = false;
    if (zip && zip != undefined && zip != null) {
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                ok = true;
            }
        }
        for (var i = 0; i < radios.length; i++) {
            if (ok) {
                radios[i].classList.remove("invalid");
            } else {
                radios[i].classList.add("invalid");
            }
        }
    }
    return ok;
}
function ShowErrorMsg(msg, time) {
    console.error("Fehler: " + msg);
    const requestFinish = document.getElementById('requestFinish');
    const requestForm = document.getElementById('requestForm');
    const ErrorWindow = document.getElementById('ErrorWindow');
    if (requestFinish && requestFinish != undefined && requestFinish != null && requestForm && requestForm != undefined && requestForm != null && ErrorWindow && ErrorWindow != undefined && ErrorWindow != null) {
        document.getElementById('ErrorText').innerHTML = msg;
        requestFinish.classList.add("non-visible");
        requestForm.classList.add("non-visible");
        ErrorWindow.classList.remove("non-visible");
        setTimeout(function () {
            ErrorWindow.classList.add("non-visible");
            requestForm.classList.remove("non-visible");
        }, time);
    }
}
function FillOrganisationenTable() {
    const suchfeld = document.getElementById("OrganisationenSuchen");
    const tbody = document.getElementById("OrganisationTable");
    const zipreverse = document.getElementById("zipreverse");
    if (suchfeld && suchfeld != undefined && suchfeld != null && tbody && tbody != undefined && tbody != null && zipreverse && zipreverse != undefined && zipreverse != null) {
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", "/Organization/SearchRev/" + zipreverse.checked + "/" + suchfeld.value, true);
        xhttp.onload = function () {
            if (xhttp.status >= 200 && xhttp.status < 400) {
                var data = JSON.parse(xhttp.responseText);
                //Delete Data
                tbody.childNodes.forEach(itm => {
                    var found = false;
                    data.forEach(datitm => {
                        if (itm.id == datitm.id) {
                            found = true;
                        }
                    });
                    if (!found) {
                        console.log("delete element" + itm.id);
                        itm.parentElement.removeChild(itm);
                    }
                });
                //Add Date
                data.forEach(itm => {
                    if (!document.getElementById(itm.id)) {
                        console.log("add element" + itm.id);
                        var tableline = document.createElement('tr');
                        var name = document.createElement('td');
                        var ansprechpartner = document.createElement('td');
                        var zips = document.createElement('td');
                        var notifyrequest = document.createElement('td');
                        var timestamp = document.createElement('td');
                        var editbtn = document.createElement('span');
                        tableline.id = itm.id;
                        name.innerHTML = itm.name;
                        ansprechpartner.innerHTML = itm.ansprechpartner;
                        zips.innerHTML = itm.zips;
                        notifyrequest.innerHTML = itm.notifyrequest;
                        timestamp.innerHTML = itm.ansprechpartner;
                        editbtn.innerHTML = '<a href="/Organization/Add/' + itm.id + '"><i class="fas fa-user-edit text-secondary" title="Bearbeitung"></i></a>';
                        tableline.appendChild(name);
                        tableline.appendChild(ansprechpartner);
                        tableline.appendChild(zips);
                        tableline.appendChild(notifyrequest);
                        tableline.appendChild(timestamp);
                        tableline.appendChild(editbtn);
                        tbody.appendChild(tableline);
                    }
                });
            } else {
                console.log("Error Get");
            }
        };
        xhttp.send();

    }
}