# -*- coding: utf-8 -*-
{
    "name": "INGTEC Safety Navigator",
    "summary": "Interaktive Ermittlung des Prüfbedarfs technischer Anlagen",
    "description": """
INGTEC Safety Navigator
=======================

Der Safety Navigator ermittelt, welche technischen Anlagen und Prüfbereiche
für ein Objekt relevant sind. Er stellt die Ergebnisse als Prüfbedarf mit
Fristen, Unterlagen und Rechtsgrundlagen dar und übergibt qualifizierte
Anfragen an das Odoo CRM.

Umfang dieses Moduls (Variante A / C der Zielarchitektur):

* Datenmodell für Objektarten, Anlagenkategorien, Anlagenstamm,
  Anlageninstanzen, Regelwerk und Navigator-Sessions
* Website-Baustein ``s_ingtec_safety_navigator`` für den Website Builder
* Landingpage ``/safety-navigator``
* Navigator-API unter ``/safety-navigator/api`` für den Betrieb als
  eigenständiger Service (Variante C)
* Owl-Frontend im Bundle ``web.assets_frontend``

Die fachliche Kernlogik liegt bewusst in ``static/src/core`` und ist
framework-unabhängig. Dieselben Module werden von der externen Web-App
(Variante B) verwendet, damit die fachliche Datenstruktur in allen drei
Bereitstellungsvarianten identisch bleibt.
    """,
    "version": "17.0.1.0.0",
    "category": "Website/Website",
    "author": "INGTEC GmbH",
    "website": "https://www.ingtec.at",
    "license": "OPL-1",
    "depends": [
        "base",
        "web",
        "website",
        "crm",
        "mail",
    ],
    "data": [
        "security/ir.model.access.csv",
        "security/security.xml",
        "data/system_category_data.xml",
        "data/object_type_data.xml",
        "data/system_type_data.xml",
        "data/rule_data.xml",
        "views/navigator_session_views.xml",
        "views/system_type_views.xml",
        "views/rule_views.xml",
        "views/menu_views.xml",
        "views/templates.xml",
        "views/snippets.xml",
    ],
    "assets": {
        # Website-Frontend: Owl-Komponenten, fachlicher Kern und Styles.
        "web.assets_frontend": [
            "ingtec_safety_navigator/static/src/scss/safety_navigator.scss",
            "ingtec_safety_navigator/static/src/core/**/*.js",
            "ingtec_safety_navigator/static/src/js/**/*.js",
            "ingtec_safety_navigator/static/src/xml/**/*.xml",
        ],
    },
    "installable": True,
    "application": True,
    "auto_install": False,
}
