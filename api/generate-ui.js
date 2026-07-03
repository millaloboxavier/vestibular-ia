const data = require("../data/vestibular-content.json");

function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function asId(item, prefix, index) {
  return item.id || `${prefix}-${index + 1}`;
}

function catalog() {
  const courses = safeArray(data.courses).map((course, index) => ({
    id: asId(course, "course", index),
    name: course.displayName || course.name || "Curso",
    city: course.city || "",
    state: course.state || "",
    school: course.school || "",
    admissions: safeArray(course.admissions),
    summary: course.summary || "",
    tags: safeArray(course.tags),
    url: course.url || ""
  }));

  const admissionTypes = safeArray(data.admissionTypes).map((item, index) => ({
    id: asId(item, "admission", index),
    label: item.label || item.name || "Forma de ingresso",
    description: item.description || "",
    status: item.status || "",
    url: item.url || ""
  }));

  const materials = safeArray(data.materials).map((item, index) => ({
    id: asId(item, "material", index),
    label: item.label || item.name || item.title || "Material",
    description: item.description || "",
    url: item.url || ""
  }));

  const events = safeArray(data.graduationEvents?.events || data.events).map((item, index) => ({
    id: asId(item, "event", index),
    name: item.name || item.title || "Evento",
    type: item.type || "Evento",
    city: item.city || "",
    state: item.state || "",
    displayDate: item.displayDate || item.date || "",
    displayTime: item.displayTime || [item.startTime, item.endTime].filter(Boolean).join(" às "),
    status: item.status || "active",
    description: item.description || "",
    url: item.cta?.url || item.url || ""
  }));

  const scholarships = safeArray(data.scholarships?.programs || data.financialAid?.programs).map((item, index) => ({
    id: asId(item, "scholarship", index),
    name: item.name || item.title || "Bolsa",
    shortDescription: item.shortDescription || item.description || "",
    cities: safeArray(item.cities),
    url: item.cta?.url || item.url || ""
  }));

  const schools = safeArray(data.schools).map((item, index) => ({
    id: asId(item, "school", index),
    name: item.name || "Escola",
    fullName: item.fullName || "",
    city: item.city || "",
    recognitions: safeArray(item.recognitions).map((rec, recIndex) => ({
      id: asId(rec, "recognition", recIndex),
      title: rec.title || "Reconhecimento",
      description: rec.description || ""
    }))
  }));

  return { courses, admissionTypes, materials, events, scholarships, schools };
}

function findByIds(collection, ids) {
  const wanted = new Set(safeArray(ids).map(String));
  return safeArray(collection).filter((item) => wanted.has(String(item.id)));
}

function matchCoursesFromText(message, selectedIds = [], selectedCities = []) {
  const q = normalize(message);
  const cities = safeArray(selectedCities).map(normalize);
  const direct = findByIds(data.courses, selectedIds);
  if (direct.length) return direct;

  let matches = safeArray(data.courses).filter((course) => {
    const cityHit = cities.length && cities.includes(normalize(course.city));
    const nameHit = normalize(course.displayName || course.name).split(" ").some((part) => part.length > 3 && q.includes(part));
    const tagHit = safeArray(course.tags).some((tag) => q.includes(normalize(tag)));
    return cityHit || nameHit || tagHit;
  });

  if (!matches.length && (q.includes("curso") || q.includes("graduacao") || q.includes("graduação"))) {
    matches = safeArray(data.courses).slice(0, 6);
  }

  return matches.slice(0, 8);
}

function activeEventsForCourses(courses) {
  const cities = new Set(safeArray(courses).map((course) => normalize(course.city)).filter(Boolean));
  return safeArray(data.graduationEvents?.events || data.events)
    .filter((event) => (event.status || "active") === "active" && cities.has(normalize(event.city)))
    .slice(0, 4);
}

function officialLinksForContext(courseIds = [], admissionIds = [], materialIds = []) {
  const links = [];
  findByIds(data.courses, courseIds).forEach((course) => {
    if (course.url) links.push({ label: course.displayName || course.name, description: `${course.school || "FGV"} · ${course.city || ""}`, url: course.url });
  });
  findByIds(data.admissionTypes, admissionIds).forEach((item) => {
    if (item.url) links.push({ label: item.label, description: item.description || "Forma de ingresso", url: item.url });
  });
  findByIds(data.materials, materialIds).forEach((item) => {
    if (item.url) links.push({ label: item.label || item.title, description: item.description || "Página oficial", url: item.url });
  });
  if (!links.length && data.meta?.officialSite) links.push({ label: "Vestibular FGV", description: "Site oficial", url: data.meta.officialSite });
  return links.slice(0, 6);
}

function resolveSections(plan, message) {
  const resolvedSections = [];
  const cityHints = safeArray(plan.entities?.cities);
  const allCourseIds = new Set();
  const allAdmissionIds = new Set();
  const allMaterialIds = new Set();

  safeArray(plan.sections).forEach((section) => {
    const type = section.type;
    const base = {
      type,
      title: section.title || "",
      intro: section.intro || "",
      layout: section.layout || "cards",
      cta: {
        label: section.ctaLabel || "",
        url: section.ctaUrl || ""
      }
    };

    if (type === "course_cards") {
      const courses = matchCoursesFromText(message, section.courseIds, cityHints);
      courses.forEach((course) => allCourseIds.add(course.id));
      resolvedSections.push({ ...base, items: courses });
      return;
    }

    if (type === "course_compare") {
      let courses = matchCoursesFromText(message, section.courseIds, cityHints).slice(0, 3);
      if (courses.length < 2) courses = safeArray(data.courses).filter((course) => ["administracao-sp", "administracao-publica-sp", "direito-sp"].includes(course.id));
      courses.forEach((course) => allCourseIds.add(course.id));
      resolvedSections.push({ ...base, items: courses });
      return;
    }

    if (type === "admission_options") {
      let items = findByIds(data.admissionTypes, section.admissionTypeIds);
      if (!items.length) items = safeArray(data.admissionTypes);
      items.forEach((item) => allAdmissionIds.add(item.id));
      resolvedSections.push({ ...base, items: items.slice(0, 6) });
      return;
    }

    if (type === "events") {
      const selectedCourses = matchCoursesFromText(message, section.courseIds, cityHints);
      let events = findByIds(data.graduationEvents?.events || data.events, section.eventIds);
      if (!events.length) events = activeEventsForCourses(selectedCourses);
      if (events.length) resolvedSections.push({ ...base, items: events });
      return;
    }

    if (type === "scholarships") {
      let items = findByIds(data.scholarships?.programs || data.financialAid?.programs, section.scholarshipIds);
      if (!items.length) items = safeArray(data.scholarships?.programs || data.financialAid?.programs);
      if (items.length) resolvedSections.push({ ...base, items: items.slice(0, 5) });
      return;
    }

    if (type === "course_differentials") {
      const courses = matchCoursesFromText(message, section.courseIds, cityHints).slice(0, 2);
      const items = [];
      courses.forEach((course) => {
        safeArray(course.courseDifferentials).forEach((diff) => items.push({ ...diff, courseName: course.displayName || course.name }));
      });
      if (items.length) resolvedSections.push({ ...base, items: items.slice(0, 8) });
      return;
    }

    if (type === "prep_materials" || type === "official_links") {
      let items = findByIds(data.materials, section.materialIds);
      if (!items.length && type === "prep_materials") items = safeArray(data.materials).filter((item) => normalize(item.label || item.title).includes("prova") || normalize(item.label || item.title).includes("gabarito"));
      if (!items.length) items = officialLinksForContext([...allCourseIds], [...allAdmissionIds], [...allMaterialIds]);
      items.forEach((item) => { if (item.id) allMaterialIds.add(item.id); });
      resolvedSections.push({ ...base, items: items.slice(0, 6) });
      return;
    }

    if (type === "timeline") {
      const courses = matchCoursesFromText(message, section.courseIds, cityHints).slice(0, 4);
      const items = [];
      courses.forEach((course) => {
        Object.entries(course.admissionDates || {}).forEach(([label, value]) => items.push({ label: `${label} · ${course.displayName || course.name}`, value, url: course.url }));
        if (course.examDates) items.push({ label: `Provas · ${course.displayName || course.name}`, value: course.examDates, url: course.url });
        if (course.resultDate) items.push({ label: `Resultado · ${course.displayName || course.name}`, value: course.resultDate, url: course.url });
      });
      if (items.length) resolvedSections.push({ ...base, items });
      return;
    }

    if (type === "lead_form" || type === "next_step" || type === "warning") {
      resolvedSections.push({ ...base, items: safeArray(section.textItems).map((text) => ({ text })) });
      return;
    }
  });

  const hasNext = resolvedSections.some((section) => section.type === "next_step");
  if (!hasNext && plan.nextStep?.title) {
    resolvedSections.push({
      type: "next_step",
      title: plan.nextStep.title,
      intro: plan.nextStep.description,
      layout: "single",
      cta: { label: plan.nextStep.actionLabel || "Continuar", url: plan.nextStep.url || "", prompt: plan.nextStep.prompt || "", actionType: plan.nextStep.actionType || "ask_followup" },
      items: []
    });
  }

  if (plan.leadCapture?.show && !resolvedSections.some((section) => section.type === "lead_form")) {
    resolvedSections.push({
      type: "lead_form",
      title: plan.leadCapture.title || "Receber aviso",
      intro: plan.leadCapture.description || "Deixe seus dados para receber novidades sobre o curso ou forma de ingresso do seu interesse.",
      layout: "form",
      cta: { label: "Enviar", url: "" },
      items: []
    });
  }

  return resolvedSections.filter((section) => section.items?.length || ["next_step", "lead_form", "warning"].includes(section.type));
}

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pageTitle", "answer", "intent", "confidence", "entities", "primaryCta", "followUpSuggestions", "nextStep", "leadCapture", "sections"],
  properties: {
    pageTitle: { type: "string" },
    answer: { type: "string" },
    intent: { type: "string", enum: ["conhecer_cursos", "comparar_cursos", "inscricao", "formas_ingresso", "enem", "provas_gabaritos", "agenda_editais", "bolsas", "evento_visita", "resultado", "faq", "fora_escopo"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    entities: {
      type: "object",
      additionalProperties: false,
      required: ["courses", "cities", "admissionTypes", "needsOfficialCheck"],
      properties: {
        courses: { type: "array", items: { type: "string" } },
        cities: { type: "array", items: { type: "string" } },
        admissionTypes: { type: "array", items: { type: "string" } },
        needsOfficialCheck: { type: "boolean" }
      }
    },
    primaryCta: {
      type: "object",
      additionalProperties: false,
      required: ["label", "url"],
      properties: { label: { type: "string" }, url: { type: "string" } }
    },
    followUpSuggestions: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
    nextStep: {
      type: "object",
      additionalProperties: false,
      required: ["title", "description", "actionLabel", "actionType", "prompt", "url"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        actionLabel: { type: "string" },
        actionType: { type: "string", enum: ["open_link", "ask_followup", "show_form"] },
        prompt: { type: "string" },
        url: { type: "string" }
      }
    },
    leadCapture: {
      type: "object",
      additionalProperties: false,
      required: ["show", "reason", "title", "description", "interestCourse", "interestCity"],
      properties: {
        show: { type: "boolean" },
        reason: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        interestCourse: { type: "string" },
        interestCity: { type: "string" }
      }
    },
    sections: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "intro", "layout", "courseIds", "admissionTypeIds", "materialIds", "eventIds", "scholarshipIds", "textItems", "ctaLabel", "ctaUrl"],
        properties: {
          type: { type: "string", enum: ["course_cards", "course_compare", "admission_options", "events", "scholarships", "course_differentials", "timeline", "prep_materials", "official_links", "next_step", "lead_form", "warning"] },
          title: { type: "string" },
          intro: { type: "string" },
          layout: { type: "string", enum: ["cards", "list", "table", "single", "form"] },
          courseIds: { type: "array", items: { type: "string" } },
          admissionTypeIds: { type: "array", items: { type: "string" } },
          materialIds: { type: "array", items: { type: "string" } },
          eventIds: { type: "array", items: { type: "string" } },
          scholarshipIds: { type: "array", items: { type: "string" } },
          textItems: { type: "array", items: { type: "string" } },
          ctaLabel: { type: "string" },
          ctaUrl: { type: "string" }
        }
      }
    }
  }
};

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const message = String(req.body?.message || "").trim();
  if (!message) return res.status(400).json({ error: "Campo 'message' ausente." });

  const apiKey = process.env.OPENAI_API_KEY || process.env.api_vestibular;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY não configurada na Vercel.", mode: "missing_api_key" });
  }

  const dataCatalog = catalog();
  const instructions = `Você é a camada de composição de interface do site Vestibular FGV.
A pessoa candidata escreveu uma busca. Sua tarefa é escolher quais seções da interface devem aparecer, em qual ordem e com quais IDs de dados oficiais.

Regras obrigatórias:
- Responda apenas com JSON válido no schema.
- Use somente IDs que aparecem na BASE_OFICIAL.
- Não invente prazos, valores, vagas, regras, reconhecimentos, bolsas ou eventos.
- O texto deve ser de interface final para vestibulandos, sem mencionar IA, JSON, componentes, intenção ou protótipo.
- A primeira seção deve entregar valor direto. Para pergunta sobre curso/cidade, comece com course_cards ou course_compare; não comece com resumo técnico.
- Para pergunta sobre curso, se houver evento ativo na mesma cidade, inclua a seção events como próximo passo contextual.
- Para pergunta sobre bolsa, inclua scholarships se houver dados de bolsas na base.
- Para pergunta sobre diferencial de curso, inclua course_differentials quando houver dados no curso.
- Sempre inclua next_step no final.
- Use leadCapture.show=true e inclua lead_form quando a pessoa pedir aviso, quando a modalidade estiver em breve/fechada ou quando quiser ser informada sobre abertura.
- Use official_links apenas como apoio discreto, não como seção principal, salvo se a pergunta pedir fonte, edital ou página oficial.
- Se a pergunta estiver fora do escopo do Vestibular FGV, use warning e next_step.

BASE_OFICIAL:
${JSON.stringify(dataCatalog)}`;

  try {
    const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/+$/, "");
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const openaiRes = await fetch(`${baseUrl}/v1/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        instructions,
        input: message,
        store: false,
        temperature: 0.2,
        text: { format: { type: "json_schema", name: "fgv_generative_ui", strict: true, schema: RESPONSE_SCHEMA } }
      })
    });

    const raw = await openaiRes.json();
    if (!openaiRes.ok) {
      return res.status(openaiRes.status >= 400 && openaiRes.status < 600 ? openaiRes.status : 502).json({ error: "A OpenAI não conseguiu gerar a resposta.", mode: "openai_error", details: raw });
    }

    const text = raw.output_text || raw.output?.flatMap((item) => item.content || []).find((content) => content.type === "output_text")?.text || "";
    if (!text) return res.status(502).json({ error: "A OpenAI respondeu sem conteúdo estruturado.", mode: "openai_empty_response" });

    let plan;
    try { plan = JSON.parse(text); }
    catch (error) { return res.status(502).json({ error: "A OpenAI respondeu em formato inesperado.", mode: "openai_parse_error", details: error.message }); }

    const sections = resolveSections(plan, message);
    return res.status(200).json({
      ...plan,
      sections,
      debug: { mode: "openai", model, renderer: "sections_v1" }
    });
  } catch (error) {
    return res.status(502).json({ error: "Não foi possível gerar a resposta com a OpenAI.", mode: "openai_exception", details: error.message });
  }
}

module.exports = handler;
module.exports.config = { maxDuration: 15 };
