/** @odoo-module **/

/**
 * INGTEC Safety Navigator – Owl-Frontend (Spezifikation Abschnitt 6 und 7)
 *
 * Der Baustein `s_ingtec_safety_navigator` wird über ein Public Widget
 * gefunden; darin wird die Owl-Anwendung montiert. Sämtliche fachliche Logik
 * stammt aus dem gemeinsamen Kern unter `static/src/core`, der mit der
 * externen Web-App (Variante B) identisch ist.
 *
 * HINWEIS: Diese Datei wurde gegen die Odoo-17-API geschrieben, aber nicht in
 * einer laufenden Odoo-Instanz getestet – im Repository steht keine zur
 * Verfügung. Vor dem Produktiveinsatz ist ein Installationstest erforderlich.
 */

import publicWidget from '@web/legacy/js/public/public_widget';
import { rpc } from '@web/core/network/rpc';
import { Component, useState, onWillStart, markup, xml } from '@odoo/owl';
import { attachComponent } from '@web/legacy/utils';

import {
    addInstance,
    answerQuestion,
    completeSession,
    createSession,
    markUnsure,
    removeInstance,
    setObjectFact,
    setObjectType,
    setStep,
    toggleSystem,
    progress,
    SELECTION_STATES,
} from '@ingtec_safety_navigator/core/engine/session';
import { evaluateSession } from '@ingtec_safety_navigator/core/engine/rule-engine';
import { searchSystemTypes } from '@ingtec_safety_navigator/core/engine/search';
import { renderBuildingSvg } from '@ingtec_safety_navigator/core/visual/building';
import { listObjectTypes, getObjectType } from '@ingtec_safety_navigator/core/model/object-types';
import { listCategories } from '@ingtec_safety_navigator/core/model/system-categories';
import {
    getSystemType,
    listSystemTypesForObjectType,
    relevanceMatrix,
} from '@ingtec_safety_navigator/core/model/system-types';

/* =========================================================================
 * ProgressHeader
 * ====================================================================== */

export class ProgressHeader extends Component {
    static template = xml`
        <nav class="sn-progress" aria-label="Fortschritt">
            <button t-foreach="state.steps" t-as="step" t-key="step.id"
                    class="sn-progress-step"
                    t-att-class="{'is-done': step.done, 'is-active': step.active}"
                    t-on-click="() => this.props.onGoto(step.id)">
                <span class="sn-progress-bar"/>
                <span class="sn-progress-label">
                    <t t-esc="step_index + 1"/>. <t t-esc="step.label"/>
                </span>
            </button>
        </nav>`;
    static props = { session: Object, onGoto: Function };

    get state() {
        return progress(this.props.session);
    }
}

/* =========================================================================
 * ObjectTypeSelector
 * ====================================================================== */

export class ObjectTypeSelector extends Component {
    static template = xml`
        <section class="sn-card">
            <span class="sn-eyebrow">Schritt 1</span>
            <h2>Um welche Art von Objekt geht es?</h2>
            <p>Die Objektart bestimmt, welche Anlagen und Prüfbereiche überhaupt in Frage kommen.</p>
            <div class="sn-objecttype-grid">
                <button t-foreach="objectTypes" t-as="objectType" t-key="objectType.id"
                        class="sn-objecttype"
                        t-att-class="{'is-active': props.session.object_type_id === objectType.id}"
                        t-att-aria-pressed="props.session.object_type_id === objectType.id"
                        t-on-click="() => this.props.onSelect(objectType.id)">
                    <b t-esc="objectType.name"/>
                    <span t-esc="objectType.short"/>
                </button>
            </div>
        </section>`;
    static props = { session: Object, onSelect: Function };

    get objectTypes() {
        return listObjectTypes();
    }
}

/* =========================================================================
 * BuildingVisualizer / SystemHotspot
 *
 * Die Grafik wird aus dem gemeinsamen Kern erzeugt, damit Odoo-Frontend und
 * externe Web-App exakt dieselbe Geometrie und dieselben Hotspot-IDs
 * verwenden. Das Markup stammt aus eigenem Code, nicht aus Nutzereingaben.
 * ====================================================================== */

export class BuildingVisualizer extends Component {
    static template = xml`
        <div class="sn-building">
            <div class="sn-building-stage" t-on-click="onStageClick">
                <t t-out="svg"/>
            </div>
            <p class="sn-building-hint">
                Anlage antippen oder anklicken, um Details zu öffnen.
                Kleine oder verdeckte Anlagen finden Sie über Liste oder Suche.
            </p>
        </div>`;
    static props = { session: Object, focusId: [String, { value: false }], onSelect: Function };

    get svg() {
        const objectType = getObjectType(this.props.session.object_type_id);
        const systemTypes = objectType ? listSystemTypesForObjectType(objectType) : [];
        const selection = {};
        for (const instance of this.props.session.instances) {
            selection[instance.system_type_id] =
                instance.selection === SELECTION_STATES.UNSURE ? 'unsure' : 'has';
        }
        return markup(
            renderBuildingSvg({ systemTypes, selection, focusId: this.props.focusId || '' }),
        );
    }

    onStageClick(event) {
        const hotspot = event.target.closest('.sn-hotspot');
        if (hotspot) {
            this.props.onSelect(hotspot.dataset.systemType);
        }
    }
}

/* =========================================================================
 * SystemSearch
 * ====================================================================== */

export class SystemSearch extends Component {
    static template = xml`
        <div>
            <input class="sn-search-field" type="search" autocomplete="off"
                   placeholder="Anlage, Synonym oder Alltagsbegriff eingeben"
                   t-att-value="props.query"
                   t-on-input="(event) => this.props.onQuery(event.target.value)"/>
            <div class="sn-search-hits">
                <button t-foreach="hits" t-as="hit" t-key="hit.system_type.id"
                        class="sn-system"
                        t-on-click="() => this.props.onSelect(hit.system_type.id)">
                    <span class="sn-system-icon" t-esc="hit.system_type.icon"/>
                    <span>
                        <b t-esc="hit.system_type.name"/>
                        <small t-esc="hit.system_type.layman_description"/>
                    </span>
                    <span class="sn-system-mark">+</span>
                </button>
            </div>
            <div class="sn-empty" t-if="props.query and !hits.length">
                Keine Anlage gefunden. Sehen Sie in der Kategorieliste nach oder fordern Sie eine Beratung an.
            </div>
        </div>`;
    static props = { session: Object, query: String, onQuery: Function, onSelect: Function };

    get hits() {
        if (!this.props.query) {
            return [];
        }
        const objectType = getObjectType(this.props.session.object_type_id);
        const pool = objectType ? listSystemTypesForObjectType(objectType) : undefined;
        return searchSystemTypes(this.props.query, { pool });
    }
}

/* =========================================================================
 * SystemList
 * ====================================================================== */

export class SystemList extends Component {
    static template = xml`
        <div>
            <div t-foreach="blocks" t-as="block" t-key="block.category.id" class="sn-category-block">
                <div class="sn-category-head">
                    <span class="sn-category-dot" t-attf-style="background:{{block.category.color}}"/>
                    <b t-esc="block.category.name"/>
                </div>
                <div class="sn-system-list">
                    <button t-foreach="block.items" t-as="item" t-key="item.id"
                            class="sn-system"
                            t-att-class="{'is-selected': isSelected(item.id)}"
                            t-on-click="() => this.props.onSelect(item.id)">
                        <span class="sn-system-icon" t-esc="item.icon"/>
                        <span>
                            <b t-esc="item.name"/>
                            <small t-esc="item.layman_description"/>
                        </span>
                        <span class="sn-system-mark" t-esc="isSelected(item.id) ? '✓' : '+'"/>
                    </button>
                </div>
            </div>
        </div>`;
    static props = { session: Object, onSelect: Function };

    get blocks() {
        const objectType = getObjectType(this.props.session.object_type_id);
        if (!objectType) {
            return [];
        }
        const systemTypes = listSystemTypesForObjectType(objectType);
        return listCategories()
            .map((category) => ({
                category,
                items: systemTypes.filter(
                    (systemType) =>
                        systemType.category === category.id ||
                        systemType.secondary_categories.includes(category.id),
                ),
            }))
            .filter((block) => block.items.length);
    }

    isSelected(systemTypeId) {
        return this.props.session.instances.some((item) => item.system_type_id === systemTypeId);
    }
}

/* =========================================================================
 * SystemDetailPanel + MaintenanceInspectionRevisionInfo
 * ====================================================================== */

export class MaintenanceInspectionRevisionInfo extends Component {
    static template = xml`
        <div class="sn-relevance">
            <span t-foreach="entries" t-as="entry" t-key="entry.key"
                  class="sn-pill" t-att-class="{'is-on': entry.relevant}" t-esc="entry.label"/>
        </div>`;
    static props = { systemType: Object };

    get entries() {
        return relevanceMatrix(this.props.systemType);
    }
}

export class SystemDetailPanel extends Component {
    static components = { MaintenanceInspectionRevisionInfo };
    static template = xml`
        <div class="sn-drawer is-open" t-on-click="onBackdrop">
            <div class="sn-drawer-panel" role="dialog" aria-modal="true">
                <div class="sn-drawer-head">
                    <h3 t-esc="systemType.name"/>
                    <button class="sn-drawer-close" t-on-click="() => this.props.onClose()">Schließen</button>
                </div>
                <p t-esc="systemType.layman_description"/>
                <MaintenanceInspectionRevisionInfo systemType="systemType"/>
                <div class="sn-btn-row">
                    <button class="sn-btn sn-btn--primary"
                            t-on-click="() => this.props.onToggle(systemType.id)">Habe ich</button>
                    <button class="sn-btn"
                            t-on-click="() => this.props.onUnsure(systemType.id)">Bin nicht sicher</button>
                </div>
                <dl class="sn-deflist">
                    <div>
                        <dt>Technische Beschreibung</dt>
                        <dd t-esc="systemType.technical_description"/>
                    </div>
                    <div>
                        <dt>Benötigte Unterlagen</dt>
                        <dd><ul><li t-foreach="systemType.required_documents" t-as="doc" t-key="doc" t-esc="doc"/></ul></dd>
                    </div>
                    <div>
                        <dt>Mögliche Rechtsgrundlagen</dt>
                        <dd><ul><li t-foreach="systemType.legal_bases" t-as="law" t-key="law" t-esc="law"/></ul></dd>
                    </div>
                </dl>
            </div>
        </div>`;
    static props = {
        systemTypeId: String,
        onClose: Function,
        onToggle: Function,
        onUnsure: Function,
    };

    get systemType() {
        return getSystemType(this.props.systemTypeId);
    }

    onBackdrop(event) {
        if (event.target.classList.contains('sn-drawer')) {
            this.props.onClose();
        }
    }
}

/* =========================================================================
 * QuestionRenderer
 * ====================================================================== */

export class QuestionRenderer extends Component {
    static template = xml`
        <section class="sn-card">
            <span class="sn-eyebrow">Schritt 3</span>
            <h2>Diese Angaben fehlen noch</h2>
            <p>Gefragt wird nur, was für eine belastbare Aussage erforderlich ist.</p>
            <div t-foreach="props.result.open_questions" t-as="question"
                 t-key="question.fact + (question.instance_id or '')" class="sn-question">
                <b t-esc="question.label"/>
                <p class="sn-question-help" t-esc="question.help"/>
                <div class="sn-answers">
                    <button t-foreach="question.options" t-as="option" t-key="option.label"
                            t-on-click="() => this.props.onAnswer(question, option.value)"
                            t-esc="option.label"/>
                </div>
                <div class="sn-rulehint">
                    Erforderlich für: <t t-esc="question.triggered_by.join(', ')"/>
                </div>
            </div>
            <div class="sn-notice sn-notice--green" t-if="!props.result.open_questions.length">
                Alle entscheidungsrelevanten Fragen sind beantwortet.
            </div>
        </section>`;
    static props = { result: Object, onAnswer: Function };
}

/* =========================================================================
 * RequirementResult
 * ====================================================================== */

export class RequirementResult extends Component {
    static template = xml`
        <section class="sn-card">
            <h3>Prüfbedarf je Anlage</h3>
            <p>
                Sortiert nach Regelpriorität: 1 behördliche Vorgabe, 2 Rechtsvorschrift,
                3 technisches Regelwerk, 4 Norm, 5 Herstelleranforderung, 6 fachliche INGTEC-Empfehlung.
            </p>
            <div t-foreach="props.result.systems" t-as="system" t-key="system.instance_id"
                 class="sn-result-system">
                <div class="sn-result-system-head">
                    <b t-esc="system.system_type_name"/>
                </div>
                <div t-foreach="system.requirements" t-as="requirement" t-key="requirement.rule_code"
                     class="sn-requirement">
                    <span class="sn-prio" t-attf-class="sn-prio-{{requirement.priority}}"
                          t-esc="requirement.priority"/>
                    <div>
                        <b t-esc="requirement.title"/>
                        <p t-esc="requirement.statement"/>
                        <div class="sn-requirement-meta">
                            <span class="sn-pill sn-pill--muted" t-esc="requirement.priority_label"/>
                            <span class="sn-pill sn-pill--muted" t-esc="requirement.assertion_quality"/>
                            <code t-esc="requirement.rule_code + ' v' + requirement.version"/>
                        </div>
                        <p><b>Grundlage:</b> <t t-esc="requirement.legal_basis"/></p>
                    </div>
                </div>
            </div>
        </section>`;
    static props = { result: Object };
}

/* =========================================================================
 * LeadForm
 * ====================================================================== */

export class LeadForm extends Component {
    static template = xml`
        <section class="sn-card">
            <h2>Ergebnis sichern oder Angebot anfordern</h2>
            <p>Bis hierher war der Check anonym. Für Angebot oder Beratung benötigen wir Kontaktdaten.</p>
            <form class="sn-form-grid" t-on-submit.prevent="onSubmit">
                <div class="sn-field">
                    <label for="sn_company">Unternehmen</label>
                    <input id="sn_company" name="company_name"/>
                </div>
                <div class="sn-field">
                    <label for="sn_contact">Ansprechperson</label>
                    <input id="sn_contact" name="contact_name"/>
                </div>
                <div class="sn-field">
                    <label for="sn_email">E-Mail</label>
                    <input id="sn_email" name="email" type="email" required="required"/>
                </div>
                <div class="sn-field">
                    <label for="sn_phone">Telefon</label>
                    <input id="sn_phone" name="phone" type="tel"/>
                </div>
                <div class="sn-field sn-field--full">
                    <label class="sn-consent">
                        <input type="checkbox" name="consent" required="required"/>
                        <span>Ich stimme der Verarbeitung meiner Angaben zur Bearbeitung dieser Anfrage zu.</span>
                    </label>
                </div>
                <div class="sn-field sn-field--full">
                    <button class="sn-btn sn-btn--primary" type="submit">Absenden</button>
                </div>
            </form>
        </section>`;
    static props = { onSubmit: Function };

    onSubmit(event) {
        const data = new FormData(event.target);
        this.props.onSubmit({
            company_name: data.get('company_name'),
            contact_name: data.get('contact_name'),
            email: data.get('email'),
            phone: data.get('phone'),
            consent: data.get('consent') === 'on',
        });
    }
}

/* =========================================================================
 * SafetyNavigator – Wurzelkomponente
 * ====================================================================== */

export class SafetyNavigator extends Component {
    static components = {
        ProgressHeader,
        ObjectTypeSelector,
        BuildingVisualizer,
        SystemSearch,
        SystemList,
        SystemDetailPanel,
        QuestionRenderer,
        RequirementResult,
        LeadForm,
    };
    static template = 'ingtec_safety_navigator.SafetyNavigator';
    static props = {
        objectType: { type: String, optional: true },
        entry: { type: String, optional: true },
    };

    setup() {
        this.state = useState({
            session: createSession(),
            viewMode: 'building',
            detailSystemTypeId: null,
            query: '',
            showLeadForm: false,
            message: '',
        });

        onWillStart(async () => {
            // Serverseitige Session anlegen: die Referenz muss aus Odoo
            // stammen, damit der Vorgang geräteübergreifend fortsetzbar ist.
            const payload = await rpc('/safety-navigator/api/session', {
                object_type: this.props.objectType || null,
            });
            if (payload && payload.reference) {
                this.state.session.reference = payload.reference;
            }
            if (this.props.objectType) {
                this.selectObjectType(this.props.objectType);
            }
            if (this.props.entry === 'permit') {
                this.state.session = setObjectFact(this.state.session, 'permit_exists', true);
            } else if (this.props.entry === 'known-system') {
                this.state.viewMode = 'search';
            } else if (this.props.entry === 'quote') {
                this.state.showLeadForm = true;
            }
        });
    }

    get result() {
        // Extern werden nur freigegebene Regeln ausgewertet (Abschnitt 24).
        return evaluateSession(this.state.session, { audience: 'public' });
    }

    selectObjectType(objectTypeId) {
        this.state.session = setStep(setObjectType(this.state.session, objectTypeId), 'systems');
        this.persist();
    }

    goto(stepId) {
        this.state.session = setStep(this.state.session, stepId);
    }

    openDetail(systemTypeId) {
        this.state.detailSystemTypeId = systemTypeId;
    }

    closeDetail() {
        this.state.detailSystemTypeId = null;
    }

    toggleSystem(systemTypeId) {
        this.state.session = toggleSystem(this.state.session, systemTypeId);
        this.state.detailSystemTypeId = null;
        this.persist();
    }

    markUnsure(systemTypeId) {
        this.state.session = markUnsure(this.state.session, systemTypeId);
        this.state.detailSystemTypeId = null;
        this.persist();
    }

    removeInstance(instanceId) {
        this.state.session = removeInstance(this.state.session, instanceId);
        this.persist();
    }

    addSystem(systemTypeId) {
        this.state.session = addInstance(this.state.session, systemTypeId);
        this.persist();
    }

    answer(question, value) {
        this.state.session = answerQuestion(this.state.session, question, value);
        this.persist();
    }

    setQuery(query) {
        this.state.query = query;
    }

    setViewMode(mode) {
        this.state.viewMode = mode;
    }

    async finish() {
        this.state.session = completeSession(setStep(this.state.session, 'result'));
        await rpc(`/safety-navigator/api/session/${this.state.session.reference}/result`, {
            result: this.result,
        });
    }

    async submitLead(contact) {
        const response = await rpc(
            `/safety-navigator/api/session/${this.state.session.reference}/lead`,
            { contact },
        );
        this.state.showLeadForm = false;
        this.state.message = response.ok
            ? 'Vielen Dank. Ihre Anfrage wurde übermittelt.'
            : 'Die Anfrage konnte nicht übermittelt werden. Bitte prüfen Sie Ihre Angaben.';
    }

    /** Spiegelt den fachlichen Zustand serverseitig, damit er fortsetzbar ist. */
    async persist() {
        const reference = this.state.session.reference;
        await rpc(`/safety-navigator/api/session/${reference}/facts`, {
            facts: this.state.session.object_facts,
        });
    }
}

/* =========================================================================
 * Montage im Website-Baustein
 * ====================================================================== */

publicWidget.registry.IngtecSafetyNavigator = publicWidget.Widget.extend({
    selector: '.s_ingtec_safety_navigator',
    disabledInEditableMode: true,

    async start() {
        const mount = this.el.querySelector('.o_ingtec_navigator_mount') || this.el;
        mount.innerHTML = '';
        await attachComponent(this, mount, SafetyNavigator, {
            objectType: mount.dataset.objectType || undefined,
            entry: mount.dataset.entry || undefined,
        });
        return this._super(...arguments);
    },
});

export default { SafetyNavigator };
