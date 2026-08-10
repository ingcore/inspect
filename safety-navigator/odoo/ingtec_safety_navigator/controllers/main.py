# -*- coding: utf-8 -*-
"""Navigator-API und Website-Routen.

Die API ist die Naht der Hybridarchitektur (Zielarchitektur Abschnitt 2):

    Odoo Website -> Safety Navigator UI -> Safety Navigator API
                 -> Rule Engine -> Anlagen- und Regelwerksdatenbank
                 -> Odoo CRM / Kontakte / Angebote / Projekte

Die Endpunkte sind bewusst so geschnitten, dass sie unverändert auch von
einer extern betriebenen Web-App (Variante B) genutzt werden können. Wer den
Navigator außerhalb von Odoo betreibt, implementiert dieselben Endpunkte in
einem eigenen Service; das Frontend bleibt unverändert.
"""

import logging

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

# Nur diese Felder dürfen aus einer öffentlichen Anfrage in eine
# Anlageninstanz geschrieben werden.
ALLOWED_INSTANCE_FIELDS = {
    "quantity",
    "location",
    "manufacturer",
    "year_built",
    "last_inspection",
    "last_inspection_unknown",
    "maintenance_contract",
    "report_available",
    "known_defects",
    "selection_state",
    "note",
}

MAX_INSTANCES_PER_SESSION = 200
MAX_UPLOAD_BYTES = 20 * 1024 * 1024


class SafetyNavigatorWebsite(http.Controller):
    """Öffentliche Seiten des Navigators (Abschnitt 5)."""

    @http.route(
        ["/safety-navigator", "/pruefbedarf", "/safety-check"],
        type="http",
        auth="public",
        website=True,
        sitemap=True,
    )
    def landing(self, **kwargs):
        return request.render("ingtec_safety_navigator.landing_page", {})

    @http.route(
        "/safety-navigator/<string:slug>",
        type="http",
        auth="public",
        website=True,
        sitemap=True,
    )
    def landing_for_object_type(self, slug, **kwargs):
        """Objektartspezifische Landingpage – trägt die SEO-Daten aus
        Abschnitt 11."""
        object_type = (
            request.env["ingtec.navigator.object_type"]
            .sudo()
            .search([("slug", "=", slug), ("active", "=", True)], limit=1)
        )
        if not object_type:
            return request.redirect("/safety-navigator")
        return request.render(
            "ingtec_safety_navigator.landing_page", {"object_type": object_type}
        )


class SafetyNavigatorApi(http.Controller):
    """Navigator-API.

    Alle Endpunkte sind ``auth="public"``, weil der Check laut Abschnitt 9
    anonym möglich sein muss. Der Zugriff auf eine Session erfolgt
    ausschließlich über die zufällige Session-Referenz; sie wirkt als
    Zugriffstoken (Capability). Deshalb wird nie eine Liste von Sessions
    ausgegeben und die Referenz nie erraten-bar vergeben.
    """

    # --- Stammdaten -------------------------------------------------------

    @http.route("/safety-navigator/api/catalog", type="json", auth="public", methods=["POST"])
    def catalog(self, object_type=None, **kwargs):
        """Objektarten, Kategorien und Anlagentypen für das Frontend."""
        env = request.env
        object_types = (
            env["ingtec.navigator.object_type"].sudo().search([("active", "=", True)])
        )
        categories = env["ingtec.system.category"].sudo().search([("active", "=", True)])

        domain = [("active", "=", True)]
        if object_type:
            selected = object_types.filtered(lambda record: record.code == object_type)
            if selected:
                allowed = selected.category_ids.ids
                domain += [
                    "|",
                    ("category_id", "in", allowed),
                    ("secondary_category_ids", "in", allowed),
                ]
        system_types = env["ingtec.system.type"].sudo().search(domain)

        return {
            "object_types": [self._object_type_payload(record) for record in object_types],
            "categories": [self._category_payload(record) for record in categories],
            "system_types": [self._system_type_payload(record) for record in system_types],
        }

    @http.route("/safety-navigator/api/rules", type="json", auth="public", methods=["POST"])
    def rules(self, audience="public", **kwargs):
        """Regelwerk.

        Abschnitt 24: Extern werden ausschließlich freigegebene Regeln
        ausgegeben. Der interne Modus setzt eine angemeldete Sitzung voraus –
        sonst könnte ein externer Aufruf den Freigabestatus umgehen.
        """
        internal = audience == "internal" and not request.env.user._is_public()
        domain = [] if internal else [("state", "=", "approved")]
        domain += [("state", "not in", ("withdrawn", "archived"))]
        records = request.env["ingtec.rule"].sudo().search(domain)
        return {
            "audience": "internal" if internal else "public",
            "rules": [self._rule_payload(record) for record in records],
        }

    # --- Session ----------------------------------------------------------

    @http.route("/safety-navigator/api/session", type="json", auth="public", methods=["POST"])
    def create_session(self, object_type=None, **kwargs):
        """Legt eine anonyme Session an (Abschnitt 9)."""
        values = {"website_id": request.website.id if request.website else False}
        if object_type:
            record = (
                request.env["ingtec.navigator.object_type"]
                .sudo()
                .search([("code", "=", object_type)], limit=1)
            )
            if record:
                values["object_type_id"] = record.id
                values["object_facts"] = dict(record.default_facts or {})
                values["state"] = "in_progress"
        session = request.env["ingtec.navigator.session"].sudo().create(values)
        return self._session_payload(session)

    @http.route(
        "/safety-navigator/api/session/<string:reference>",
        type="json",
        auth="public",
        methods=["POST"],
    )
    def read_session(self, reference, **kwargs):
        """Nimmt einen Vorgang über die Referenz wieder auf (SaveAndContinue)."""
        session = self._session_by_reference(reference)
        if not session:
            return {"error": "not_found"}
        return self._session_payload(session)

    @http.route(
        "/safety-navigator/api/session/<string:reference>/facts",
        type="json",
        auth="public",
        methods=["POST"],
    )
    def set_facts(self, reference, facts=None, **kwargs):
        session = self._session_by_reference(reference)
        if not session:
            return {"error": "not_found"}
        merged = dict(session.object_facts or {})
        # Nur einfache Werte übernehmen – keine verschachtelten Strukturen.
        for key, value in (facts or {}).items():
            if isinstance(value, (bool, int, float, str)) or value is None:
                merged[str(key)] = value
        session.write({"object_facts": merged, "state": "in_progress"})
        return self._session_payload(session)

    @http.route(
        "/safety-navigator/api/session/<string:reference>/instance",
        type="json",
        auth="public",
        methods=["POST"],
    )
    def upsert_instance(self, reference, system_type=None, instance_id=None, values=None, **kwargs):
        session = self._session_by_reference(reference)
        if not session:
            return {"error": "not_found"}

        payload = {key: value for key, value in (values or {}).items() if key in ALLOWED_INSTANCE_FIELDS}

        if instance_id:
            instance = session.instance_ids.filtered(lambda record: record.id == int(instance_id))
            if not instance:
                return {"error": "not_found"}
            instance.write(payload)
        else:
            if len(session.instance_ids) >= MAX_INSTANCES_PER_SESSION:
                return {"error": "too_many_instances"}
            system = (
                request.env["ingtec.system.type"]
                .sudo()
                .search([("code", "=", system_type), ("active", "=", True)], limit=1)
            )
            if not system:
                return {"error": "unknown_system_type"}
            payload.update({"session_id": session.id, "system_type_id": system.id})
            request.env["ingtec.system.instance"].sudo().create(payload)

        return self._session_payload(session)

    @http.route(
        "/safety-navigator/api/session/<string:reference>/instance/<int:instance_id>/delete",
        type="json",
        auth="public",
        methods=["POST"],
    )
    def delete_instance(self, reference, instance_id, **kwargs):
        session = self._session_by_reference(reference)
        if not session:
            return {"error": "not_found"}
        session.instance_ids.filtered(lambda record: record.id == instance_id).unlink()
        return self._session_payload(session)

    @http.route(
        "/safety-navigator/api/session/<string:reference>/result",
        type="json",
        auth="public",
        methods=["POST"],
    )
    def store_result(self, reference, result=None, **kwargs):
        """Friert das Ergebnis der Rule Engine an der Session ein.

        Das Ergebnis wird als Momentaufnahme gespeichert, damit später
        nachvollziehbar bleibt, welche Regelfassung zu welcher Aussage geführt
        hat.
        """
        session = self._session_by_reference(reference)
        if not session:
            return {"error": "not_found"}
        session.write({"result_snapshot": result or {}})
        session.action_complete()
        return {"ok": True, "reference": session.reference}

    @http.route(
        "/safety-navigator/api/session/<string:reference>/lead",
        type="json",
        auth="public",
        methods=["POST"],
    )
    def create_lead(self, reference, contact=None, **kwargs):
        """Übergabe an Odoo CRM. Erst hier entstehen personenbezogene Daten."""
        session = self._session_by_reference(reference)
        if not session:
            return {"error": "not_found"}

        contact = contact or {}
        if not contact.get("consent"):
            return {"error": "consent_required"}
        if not contact.get("email"):
            return {"error": "email_required"}

        session.write(
            {
                "company_name": contact.get("company_name") or "",
                "contact_name": contact.get("contact_name") or "",
                "email": contact.get("email"),
                "phone": contact.get("phone") or "",
                "consent_status": "granted",
            }
        )
        lead = session.action_create_lead()
        return {"ok": True, "reference": session.reference, "lead_id": lead.id}

    @http.route(
        "/safety-navigator/api/session/<string:reference>/attachment",
        type="http",
        auth="public",
        methods=["POST"],
        csrf=True,
    )
    def upload_attachment(self, reference, ufile=None, document_type="sonstiges", **kwargs):
        """Dokumentenupload (DocumentUploader)."""
        session = self._session_by_reference(reference)
        if not session or not ufile:
            return request.make_json_response({"error": "not_found"}, status=404)

        content = ufile.read()
        if len(content) > MAX_UPLOAD_BYTES:
            return request.make_json_response({"error": "too_large"}, status=413)

        attachment = (
            request.env["ir.attachment"]
            .sudo()
            .create(
                {
                    "name": ufile.filename,
                    "raw": content,
                    "res_model": "ingtec.navigator.session",
                    "res_id": session.id,
                    "description": document_type,
                }
            )
        )
        session.write({"attachment_ids": [(4, attachment.id)]})
        return request.make_json_response({"ok": True, "attachment_id": attachment.id})

    # --- Hilfsfunktionen --------------------------------------------------

    def _session_by_reference(self, reference):
        """Sucht eine Session über ihre Referenz.

        Die Referenz ist das einzige Zugriffsmerkmal. Sie wird normalisiert,
        damit Groß-/Kleinschreibung und Leerzeichen keine Rolle spielen.
        """
        normalized = (reference or "").strip().upper()
        if not normalized:
            return None
        return (
            request.env["ingtec.navigator.session"]
            .sudo()
            .search([("reference", "=", normalized)], limit=1)
        )

    def _object_type_payload(self, record):
        return {
            "id": record.code,
            "name": record.name,
            "short": record.short_description or "",
            "svg_variant": record.svg_variant or "",
            "categories": record.category_ids.mapped("code"),
            "priority": record.priority,
            "slug": record.slug,
            "seo": {"title": record.seo_title or "", "description": record.seo_description or ""},
            "default_facts": record.default_facts or {},
            "active": record.active,
        }

    def _category_payload(self, record):
        return {
            "id": record.code,
            "name": record.name,
            "short": record.short_description or "",
            "svg_layer_id": record.svg_layer_id or "",
            "color": record.color or "#475467",
            "icon": record.icon or "",
            "department": record.department or "",
            "sequence": record.sequence,
            "active": record.active,
        }

    def _system_type_payload(self, record):
        def lines(value):
            return [line.strip() for line in (value or "").splitlines() if line.strip()]

        return {
            "id": record.code,
            "category": record.category_id.code,
            "secondary_categories": record.secondary_category_ids.mapped("code"),
            "name": record.name,
            "synonyms": record.synonym_ids.mapped("name"),
            "layman_description": record.layman_description or "",
            "technical_description": record.technical_description or "",
            "icon": record.icon or "",
            "svg_layer_id": record.svg_layer_id or "",
            "svg_object_id": record.svg_object_id or "",
            "hotspot_id": record.hotspot_id or "",
            "hotspot": {"x": record.hotspot_x, "y": record.hotspot_y, "area": record.hotspot_area or ""},
            "maintenance_relevant": record.maintenance_relevant,
            "inspection_relevant": record.inspection_relevant,
            "test_relevant": record.test_relevant,
            "revision_relevant": record.revision_relevant,
            "typical_interval": {
                "value": record.interval_value or None,
                "unit": record.interval_unit,
                "note": record.interval_note or "",
            },
            "interval_type": record.interval_type,
            "test_type": record.test_type or "",
            "department": record.department or "",
            "expertise": record.expertise or "",
            "required_documents": lines(record.required_documents),
            "typical_hazards": lines(record.typical_hazards),
            "typical_defects": lines(record.typical_defects),
            "legal_bases": lines(record.legal_bases),
            "standards": {
                "trvb": lines(record.standard_trvb),
                "onorm": lines(record.standard_onorm),
                "en": lines(record.standard_en),
                "iso": lines(record.standard_iso),
            },
            "manufacturer_requirements": record.manufacturer_requirements or "",
            "permit_relevant": record.permit_relevant,
            "safety_score_category": record.safety_score_category or "",
            "source_status": record.source_status,
            "sequence": record.sequence,
            "active": record.active,
        }

    def _rule_payload(self, record):
        return {
            "code": record.code,
            "title": record.title,
            "system_type": record.system_type_id.code or "*",
            "scope": record.scope,
            "conditions": record.conditions or {"all": []},
            "outcome": {
                "kind": record.outcome_kind,
                "statement": record.outcome_statement or "",
                "interval": (
                    {"value": record.outcome_interval_value, "unit": record.outcome_interval_unit}
                    if record.outcome_interval_value
                    else None
                ),
                "required_documents": [
                    line.strip()
                    for line in (record.outcome_documents or "").splitlines()
                    if line.strip()
                ],
                "recommended_action": record.recommended_action or "",
            },
            "assertion_quality": record.assertion_quality,
            "legal_basis": record.legal_basis or "",
            "priority": int(record.priority or 6),
            "version": record.version,
            "valid_from": record.valid_from and record.valid_from.isoformat() or None,
            "state": record.state,
            "approved": record.state == "approved",
            "source_status": record.source_status,
        }

    def _session_payload(self, session):
        return {
            "reference": session.reference,
            "state": session.state,
            "object_type_id": session.object_type_id.code or None,
            "object_facts": session.object_facts or {},
            "consent_status": session.consent_status,
            "started_at": session.started_at and session.started_at.isoformat() or None,
            "completed_at": session.completed_at and session.completed_at.isoformat() or None,
            "instances": [
                {
                    "id": instance.id,
                    "system_type_id": instance.system_type_id.code,
                    "selection": instance.selection_state,
                    "facts": {
                        "count": instance.quantity,
                        "location": instance.location or "",
                        "manufacturer": instance.manufacturer or "",
                        "year_built": instance.year_built or None,
                        "last_inspection": (
                            "unknown"
                            if instance.last_inspection_unknown
                            else (instance.last_inspection and instance.last_inspection.isoformat())
                        ),
                        "maintenance_contract": instance.maintenance_contract,
                        "report_available": instance.report_available,
                        "known_defects": instance.known_defects,
                        **(instance.facts or {}),
                    },
                }
                for instance in session.instance_ids
            ],
            "documents": [
                {"id": attachment.id, "name": attachment.name, "document_type": attachment.description or ""}
                for attachment in session.attachment_ids
            ],
        }
