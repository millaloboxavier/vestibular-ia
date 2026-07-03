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
  return item?.id || `${prefix}-${index + 1}`;
}

function formatDate(dateString = "") {
  const match = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateString;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatPeriod(startDate, endDate) {
  if (startDate && endDate) return `${formatDate(startDate)} a ${formatDate(endDate)}`;
  if (startDate) return `a partir de ${formatDate(startDate)}`;
  if (endDate) return `até ${formatDate(endDate)}`;
  return "";
}

function labelStatus(status = "") {
  const value = normalize(status).replace(/_/g, " ");
  if (!value) return "";
  if (value.includes("em breve")) return "Inscrições em breve";
  if (value.includes("abert")) return "Inscrições abertas";
  if (value.includes("encerr")) return "Inscrições encerradas";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function cleanCopy(text = "") {
  let value = String(text || "");
  const replacements = [
    [/para mais informações sobre as datas e modalidades de ingresso,?\s*(você pode )?(consultar|acessar|ver) (a )?(página|site) oficial( do Vestibular FGV)?\.?/gi, "Veja abaixo as datas e modalidades relacionadas à sua busca."],
    [/(você pode )?(consultar|acesse|acessar|ver|visite) (a )?(página|site) oficial( do Vestibular FGV)?\.?/gi, "Veja as informações nesta página."],
    [/consulte (o )?edital oficial\.?/gi, "Confira as orientações desta página."],
    [/na página oficial( do Vestibular FGV)?/gi, "nesta página"],
    [/página oficial( do Vestibular FGV)?/gi, "esta página"],
    [/site oficial( do Vestibular FGV)?/gi, "esta página"],
    [/site do Vestibular FGV/gi, "Vestibular FGV"],
    [/links oficiais/gi, "links úteis"],
    [/a partir desta busca/gi, "agora"],
    [/relacionadas? à sua busca/gi, "relacionadas ao que você procura"],
    [/para sua busca/gi, "para este momento"],
    [/sua busca/gi, "o que você procura"],
    [/esta busca/gi, "este momento"],
    [/resultado da busca/gi, "Caminho sugerido"],
    [/oficial/gi, ""],
    [/\s+\./g, "."],
    [/\s+,/g, ","],
    [/\s{2,}/g, " "]
  ];
  replacements.forEach(([pattern, replacement]) => { value = value.replace(pattern, replacement); });
  return value.trim();
}

function courseName(course) {
  return course?.displayName || course?.name || "Curso";
}

function allEvents() {
  return safeArray(data.graduationEvents?.events || data.events).map((event, index) => ({
    id: asId(event, "event", index),
    name: event.name || event.title || "Evento",
    type: event.type || "Evento",
    city: event.city || "",
    state: event.state || "",
    date: event.date || "",
    displayDate: event.displayDate || formatDate(event.date || ""),
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    displayTime: event.displayTime || [event.startTime, event.endTime].filter(Boolean).join(" às "),
    status: event.status || "active",
    description: event.description || "",
    tags: safeArray(event.tags)
  }));
}

function catalog() {
  const courses = safeArray(data.courses).map((course, index) => ({
    id: asId(course, "course", index),
    name: courseName(course),
    rawName: course.name || "",
    city: course.city || "",
    state: course.state || "",
    school: course.school || "",
    schoolId: course.schoolId || "",
    entry: course.entry || "",
    duration: course.duration || "",
    period: course.period || "",
    tuition: course.tuition || "",
    campus: course.campus || "",
    admissions: safeArray(course.admissions),
    candidatePerSeat: course.candidatePerSeat || "",
    admissionDates: course.admissionDates || {},
    examDates: course.examDates || "",
    resultDate: course.resultDate || "",
    summary: course.summary || "",
    tags: safeArray(course.tags),
    hasDifferentials: safeArray(course.courseDifferentials).length > 0
  }));

  const admissionTypes = safeArray(data.admissionTypes).map((item, index) => ({
    id: asId(item, "admission", index),
    label: item.label || item.name || "Forma de ingresso",
    description: item.description || "",
    status: item.status || "",
    statusLabel: labelStatus(item.status || ""),
    cycle: item.cycle || "",
    startDate: item.startDate || "",
    endDate: item.endDate || "",
    period: formatPeriod(item.startDate, item.endDate),
    shortDescription: item.shortDescription || "",
    registrationFrequency: item.registrationFrequency || "",
    eligibility: safeArray(item.eligibility),
    examFormat: safeArray(item.examFormat),
    examPhases: item.examPhases || "",
    preparation: item.preparation || "",
    requiredDocuments: safeArray(item.requiredDocuments),
    locationRule: item.locationRule || "",
    faq: safeArray(item.faq)
  }));

  const materials = safeArray(data.materials).map((item, index) => ({
    id: asId(item, "material", index),
    label: item.label || item.name || item.title || "Material",
    description: item.description || ""
  }));

  const scholarships = safeArray(data.scholarships?.programs || data.financialAid?.programs).map((item, index) => ({
    id: asId(item, "scholarship", index),
    name: item.name || item.title || "Bolsa",
    shortDescription: item.shortDescription || item.description || "",
    type: item.type || "",
    cities: safeArray(item.cities),
    tags: safeArray(item.tags)
  }));

  const schools = safeArray(data.schools).map((school, index) => ({
    id: asId(school, "school", index),
    name: school.name || "Escola",
    fullName: school.fullName || "",
    city: school.city || "",
    summary: school.summary || "",
    recognitionsTitle: school.recognitionsTitle || "Reconhecimentos da escola",
    recognitionsIntro: school.recognitionsIntro || "",
    recognitions: safeArray(school.recognitions).map((rec, recIndex) => ({
      id: asId(rec, "recognition", recIndex),
      title: rec.title || "Reconhecimento",
      description: rec.description || "",
      type: rec.type || ""
    }))
  }));

  return {
    courses,
    admissionTypes,
    materials,
    events: allEvents(),
    scholarships,
    schools
  };
}

function findByIds(collection, ids) {
  const wanted = new Set(safeArray(ids).filter(Boolean).map(String));
  return safeArray(collection).filter((item) => wanted.has(String(item.id)));
}

function cityHits(message, selectedCities = []) {
  const q = normalize(message);
  const hints = new Set(safeArray(selectedCities).map(normalize));
  if (q.includes("sao paulo") || q.includes("sp")) hints.add("sao paulo");
  if (q.includes("rio de janeiro") || q.includes(" rj") || q === "rio" || q.includes(" no rio") || q.includes("do rio")) hints.add("rio de janeiro");
  if (q.includes("brasilia") || q.includes("df")) hints.add("brasilia");
  return [...hints];
}

function querySignals(message) {
  const q = normalize(message);
  return {
    q,
    asksCourse: /(curso|graduacao|graduação|administracao|administração|direito|economia|dados|inteligencia|inteligência|comunicacao|comunicação|relacoes|relações|matematica|matemática|sociais)/.test(q),
    asksDate: /(data|prazo|quando|inscric|inscrição|inscrever|termina|abre|abertura|calendario|calendário)/.test(q),
    asksVestibularSpecific: /(vestibular fgv|data.*vestibular|vestibular.*data|prova.*vestibular|vestibular.*prova|inscri.*vestibular|vestibular.*inscri|fazer o vestibular|quero fazer vestibular|vestibular$)/.test(q) && !/(enem|internacional|transfer|demanda social|olimpiad|modalidades|formas de ingresso|todas as formas)/.test(q),
    asksAdmission: /(vestibular|enem|ingresso|modalidade|transferencia|transferência|internacional|demanda social|olimpiada|olimpíada)/.test(q),
    asksScholarship: /(bolsa|bolsas|financiamento|merito|mérito|demanda social|restituivel|restituível)/.test(q),
    asksEvent: /(evento|visita|experiencia|experiência|imersiva|conhecer de perto|aula tematica|aula temática)/.test(q),
    asksPrep: /(prova|gabarito|treinar|preparar|conteudo programatico|conteúdo programático|edital)/.test(q),
    asksCompare: /(comparar|diferenca|diferença|versus| vs |qual e melhor|qual é melhor)/.test(q),
    asksDifferentials: /(diferencial|diferenciais|reconhecimento|reconhecida|internacional|duplo diploma|dupla graduacao|dupla graduação|carreira|vale a pena|ingles|inglês)/.test(q),
    asksLead: /(avis|avise|receber|notifica|notificar|quando abrir|em breve)/.test(q)
  };
}

function matchAdmissionTypes(message, ids = []) {
  const q = normalize(message);
  const sig = querySignals(message);
  const all = safeArray(data.admissionTypes);
  const direct = findByIds(all, ids);
  if (direct.length) return direct;

  if (sig.asksVestibularSpecific) {
    const item = all.find((admission) => admission.id === "vestibular-fgv");
    return item ? [item] : [];
  }

  if (q.includes("enem")) return all.filter((item) => normalize(item.label || item.name || "").includes("enem"));
  if (q.includes("internacional")) return all.filter((item) => normalize(item.label || item.name || "").includes("internacional"));
  if (q.includes("transfer")) return all.filter((item) => normalize(item.label || item.name || "").includes("transfer"));
  if (q.includes("demanda")) return all.filter((item) => normalize(item.label || item.name || "").includes("demanda"));
  if (q.includes("olimpiada") || q.includes("olimpíada")) return all.filter((item) => normalize(item.label || item.name || "").includes("olimpi"));

  if (sig.asksAdmission || /formas de ingresso|modalidades|opcoes de ingresso|opções de ingresso/.test(q)) return all.slice(0, 6);
  if (sig.asksDate) {
    const item = all.find((admission) => admission.id === "vestibular-fgv");
    return item ? [item] : all.slice(0, 1);
  }
  return [];
}

function matchCoursesFromText(message, selectedIds = [], selectedCities = []) {
  const q = normalize(message);
  const cities = cityHits(message, selectedCities);
  const direct = findByIds(data.courses, selectedIds);
  if (direct.length) return direct;

  let matches = safeArray(data.courses).filter((course) => {
    const name = normalize(`${course.displayName || course.name || ""} ${course.name || ""}`);
    const school = normalize(course.school || "");
    const city = normalize(course.city || "");
    const tags = safeArray(course.tags).map(normalize).join(" ");
    const haystack = `${name} ${school} ${city} ${tags}`;
    const cityHit = cities.length ? cities.includes(city) : false;
    const nameHit = name.split(" ").some((part) => part.length > 4 && q.includes(part));
    const tagHit = safeArray(course.tags).some((tag) => normalize(tag).length > 3 && q.includes(normalize(tag)));
    const specific = ["direito", "economia", "administracao", "administração", "dados", "inteligencia", "inteligência", "comunicacao", "comunicação", "matematica", "matemática", "sociais", "relacoes", "relações"].some((term) => normalize(term).length && q.includes(normalize(term)) && haystack.includes(normalize(term)));
    if (cities.length && !cityHit && !specific && !nameHit && !tagHit) return false;
    return cityHit || nameHit || tagHit || specific;
  });

  const sig = querySignals(message);
  if (!matches.length && cities.length) {
    matches = safeArray(data.courses).filter((course) => cities.includes(normalize(course.city)));
  }
  if (!matches.length && sig.asksCourse) {
    matches = safeArray(data.courses).slice(0, 6);
  }

  return matches.slice(0, 8);
}

function activeEventsByCities(cities = []) {
  const wanted = new Set(safeArray(cities).map(normalize).filter(Boolean));
  return allEvents()
    .filter((event) => (event.status || "active") === "active" && wanted.has(normalize(event.city)))
    .slice(0, 4);
}

function activeEventsForCourses(courses = []) {
  const cities = [...new Set(safeArray(courses).map((course) => course.city).filter(Boolean))];
  return activeEventsByCities(cities);
}

function buildTimelineItems(message, courses = [], admissionIds = []) {
  const items = [];
  const selectedAdmissions = matchAdmissionTypes(message, admissionIds);

  safeArray(courses).slice(0, 4).forEach((course) => {
    const dates = course.admissionDates || {};
    Object.entries(dates).forEach(([label, value]) => {
      items.push({ label: `${label} · ${courseName(course)}`, value, description: `${course.city || ""}${course.state ? ` / ${course.state}` : ""}`.trim() });
    });
    if (!Object.keys(dates).length) {
      selectedAdmissions.forEach((admission) => {
        const label = admission.label || admission.name || "Forma de ingresso";
        if (safeArray(course.admissions).some((item) => normalize(item).includes(normalize(label).slice(0, 6)) || normalize(label).includes(normalize(item).slice(0, 6)))) {
          items.push({ label: `${label} · ${courseName(course)}`, value: formatPeriod(admission.startDate, admission.endDate) || labelStatus(admission.status), description: `${course.city || ""}${course.state ? ` / ${course.state}` : ""}`.trim() });
        }
      });
    }
    if (course.examDates) items.push({ label: `Provas · ${courseName(course)}`, value: course.examDates, description: `${course.city || ""}${course.state ? ` / ${course.state}` : ""}`.trim() });
    if (course.resultDate) items.push({ label: `Resultado · ${courseName(course)}`, value: course.resultDate, description: `${course.city || ""}${course.state ? ` / ${course.state}` : ""}`.trim() });
  });

  if (!items.length) {
    selectedAdmissions.forEach((admission) => {
      items.push({
        label: admission.label || admission.name || "Forma de ingresso",
        value: formatPeriod(admission.startDate, admission.endDate) || labelStatus(admission.status),
        description: [admission.cycle, labelStatus(admission.status)].filter(Boolean).join(" · ")
      });
    });
  }
  return items.slice(0, 8);
}

function admissionItems(message, courses = [], admissionIds = []) {
  const selectedAdmissions = matchAdmissionTypes(message, admissionIds);
  if (!courses.length) {
    return selectedAdmissions.map((item) => ({
      id: item.id,
      label: item.label || item.name || "Forma de ingresso",
      description: item.description || "",
      status: labelStatus(item.status),
      cycle: item.cycle || "",
      period: formatPeriod(item.startDate, item.endDate)
    }));
  }

  const names = new Set();
  courses.forEach((course) => safeArray(course.admissions).forEach((name) => names.add(name)));
  let items = safeArray(data.admissionTypes).filter((item) => {
    const label = normalize(item.label || item.name || "");
    return [...names].some((name) => {
      const n = normalize(name);
      return label.includes(n.slice(0, 8)) || n.includes(label.slice(0, 8));
    });
  });
  if (!items.length) items = selectedAdmissions;
  return items.slice(0, 6).map((item) => ({
    id: item.id,
    label: item.label || item.name || "Forma de ingresso",
    description: item.description || "",
    status: labelStatus(item.status),
    cycle: item.cycle || "",
    period: formatPeriod(item.startDate, item.endDate)
  }));
}

function representativeCourses(limit = 999) {
  const seen = new Set();
  const preferredCities = ["Rio de Janeiro", "São Paulo", "Brasília"];
  const ordered = [];
  preferredCities.forEach((city) => {
    safeArray(data.courses).forEach((course) => {
      const key = `${course.displayName || course.name}-${course.city}`;
      if (!seen.has(key) && course.city === city) {
        ordered.push(course);
        seen.add(key);
      }
    });
  });
  return ordered.slice(0, limit);
}

function generalAdmissionPeriod() {
  const admissions = safeArray(data.admissionTypes).filter((item) => item.startDate || item.endDate);
  const first = admissions[0];
  if (!first) return "";
  return formatPeriod(first.startDate, first.endDate);
}

function vestibularAdmission() {
  return safeArray(data.admissionTypes).find((item) => item.id === "vestibular-fgv") || null;
}

function vestibularDetailsItems() {
  const item = vestibularAdmission();
  if (!item) return [];
  const rows = [];
  if (item.registrationFrequency) rows.push({ title: "Quando acontece", shortDescription: item.registrationFrequency, type: "calendário" });
  if (safeArray(item.examFormat).length) rows.push({ title: "Como são as provas", shortDescription: safeArray(item.examFormat).join(", ") + ".", type: "prova" });
  if (item.examPhases) rows.push({ title: "Fases do processo", shortDescription: item.examPhases, type: "etapas" });
  if (safeArray(item.requiredDocuments).length) rows.push({ title: "O que levar no dia da prova", shortDescription: safeArray(item.requiredDocuments).join(" "), type: "documentos" });
  if (item.locationRule) rows.push({ title: "Escolha da cidade de prova", shortDescription: item.locationRule, type: "local de prova" });
  return rows.slice(0, 5);
}


function isSpecificCourseContext(message, courses = [], cityHints = []) {
  const sig = querySignals(message);
  const list = safeArray(courses);
  if (!list.length) return false;
  if (list.length === 1) return true;
  if (sig.asksDifferentials && list.length === 1) return true;
  return false;
}

function isBroadCourseExploration(message, courses = [], cityHints = []) {
  const sig = querySignals(message);
  if (!sig.asksCourse || sig.asksDate || sig.asksCompare || sig.asksDifferentials) return false;
  return !isSpecificCourseContext(message, courses, cityHints);
}

function shouldShowCourseContextEvents(message, courses = [], cityHints = []) {
  const sig = querySignals(message);
  if (sig.asksEvent) return true;
  if (cityHints.length) return true;
  return isSpecificCourseContext(message, courses, cityHints);
}

function courseDifferentials(courses = []) {
  const courseList = safeArray(courses);
  if (courseList.length !== 1) return [];
  const items = [];
  courseList.forEach((course) => {
    safeArray(course.courseDifferentials).forEach((diff) => {
      items.push({
        id: diff.id,
        title: diff.title || "Diferencial",
        shortDescription: diff.shortDescription || diff.description || "",
        type: diff.type || "",
        courseName: courseName(course)
      });
    });
  });
  return items.slice(0, 8);
}

function schoolRecognitions(courses = []) {
  const courseList = safeArray(courses);
  if (courseList.length !== 1) return [];
  const schoolIds = new Set(courseList.map((course) => course.schoolId).filter(Boolean));
  const items = [];
  safeArray(data.schools).forEach((school) => {
    if (!schoolIds.has(school.id)) return;
    safeArray(school.recognitions).forEach((rec) => items.push({
      id: rec.id,
      title: rec.title || "Reconhecimento",
      shortDescription: rec.description || "",
      type: rec.type || "",
      schoolName: school.name || ""
    }));
  });
  return items.slice(0, 6);
}

function action(label, prompt, tone = "default") {
  return { label, prompt, tone };
}

function buildNextActions(message, courses = [], visibleTypes = []) {
  const sig = querySignals(message);
  const actions = [];
  const courseList = safeArray(courses);
  const mainCourse = courseList[0];
  const visible = new Set(visibleTypes);
  const specificCourse = courseList.length === 1;
  const broadCourse = sig.asksCourse && !specificCourse && !sig.asksDate && !sig.asksCompare && !sig.asksDifferentials;

  if (sig.asksVestibularSpecific || (sig.asksDate && normalize(message).includes("vestibular"))) {
    if (!visible.has("prep_materials")) actions.push(action("Estudar com provas anteriores", "quero estudar com provas anteriores do Vestibular FGV", "primary"));
    if (!visible.has("events")) actions.push(action("Conhecer eventos da graduação", "quais eventos da graduação estão disponíveis?"));
    actions.push(action("Ver cursos disponíveis", "quais cursos a FGV oferece?"));
    if (!visible.has("lead_form")) actions.push(action("Receber aviso de inscrição", "quero receber aviso quando as inscrições abrirem"));
    return actions.slice(0, 4);
  }

  if (sig.asksDate) {
    actions.push(action("Ver cursos disponíveis", "quais cursos a FGV oferece?"));
    actions.push(action("Entender formas de ingresso", "quais formas de ingresso posso usar?"));
    if (!visible.has("events")) actions.push(action("Conhecer eventos da graduação", "quais eventos da graduação estão disponíveis?"));
    if (!visible.has("lead_form")) actions.push(action("Receber aviso de inscrição", "quero receber aviso quando as inscrições abrirem", "primary"));
    return actions.slice(0, 4);
  }

  if (sig.asksPrep) {
    actions.push(action("Ver datas do Vestibular FGV", "quais são as datas do Vestibular FGV?", "primary"));
    actions.push(action("Conhecer cursos", "quais cursos a FGV oferece?"));
    actions.push(action("Receber aviso de inscrição", "quero receber aviso quando as inscrições abrirem"));
    return actions.slice(0, 3);
  }

  if (broadCourse) {
    if (normalize(message).includes("administracao")) actions.push(action("Comparar opções de Administração", "qual a diferença entre Administração de Empresas e Administração Pública?", "primary"));
    else actions.push(action("Comparar cursos", "quero comparar cursos", "primary"));
    actions.push(action("Entender formas de ingresso", "quais formas de ingresso posso usar?"));
    actions.push(action("Ver bolsas de estudo", "quais bolsas de estudo a FGV oferece?"));
    actions.push(action("Conhecer eventos da graduação", "quais eventos da graduação estão disponíveis?"));
    return actions.slice(0, 4);
  }

  if (specificCourse && mainCourse && !visible.has("admission_options")) actions.push(action("Ver formas de ingresso", `quais formas de ingresso existem para ${courseName(mainCourse)} em ${mainCourse.city}?`, "primary"));
  if (specificCourse && mainCourse && activeEventsForCourses([mainCourse]).length && !visible.has("events")) actions.push(action("Conhecer eventos na cidade", `quais eventos da graduação existem em ${mainCourse.city}?`));
  if (specificCourse && mainCourse && !visible.has("course_differentials") && safeArray(mainCourse.courseDifferentials).length) actions.push(action("Ver diferenciais do curso", `quais são os diferenciais de ${courseName(mainCourse)} em ${mainCourse.city}?`));
  if (!sig.asksCompare) actions.push(action("Comparar com outro curso", "quero comparar cursos"));
  if (!sig.asksScholarship && actions.length < 4) actions.push(action("Ver bolsas de estudo", "quais bolsas de estudo a FGV oferece?"));
  if (!actions.length) actions.push(action("Conhecer cursos", "quais cursos a FGV oferece?", "primary"));
  return Array.from(new Map(actions.map((item) => [item.label, item])).values()).slice(0, 4);
}

function sectionBase(section, type, fallbackTitle, fallbackIntro, layout = "cards") {
  return {
    type,
    title: cleanCopy(section?.title || fallbackTitle),
    intro: cleanCopy(section?.intro || fallbackIntro),
    layout: section?.layout || layout,
    actions: []
  };
}

function resolveSections(plan, message) {
  const sig = querySignals(message);
  const cityHints = cityHits(message, plan.entities?.cities);
  let selectedCourses = matchCoursesFromText(message, plan.entities?.courseIds || plan.entities?.courses || [], cityHints);
  if (sig.asksCourse && !selectedCourses.length && !sig.asksCompare && !cityHints.length) {
    selectedCourses = representativeCourses();
  }
  const selectedAdmissions = matchAdmissionTypes(message, plan.entities?.admissionTypeIds || plan.entities?.admissionTypes || []);
  const specificCourseContext = () => isSpecificCourseContext(message, selectedCourses, cityHints);
  const broadCourseContext = () => isBroadCourseExploration(message, selectedCourses, cityHints);
  const resolved = [];
  const addSection = (section) => {
    if (!section) return;
    if (["course_cards", "timeline", "admission_options", "events", "scholarships", "course_differentials", "school_recognitions", "course_compare", "prep_materials", "admission_details", "warning", "lead_form"].includes(section.type)) {
      const already = resolved.some((item) => item.type === section.type);
      if (already && !["course_cards"].includes(section.type)) return;
    }
    resolved.push(section);
  };

  const requestedSections = safeArray(plan.sections).filter((section) => section.type !== "official_links");

  // Datas e inscrição precisam aparecer logo no início quando essa é a pergunta.
  if (sig.asksDate || plan.intent === "inscricao" || plan.intent === "agenda_editais") {
    const timelineItems = buildTimelineItems(message, selectedCourses, selectedAdmissions.map((item) => item.id));
    addSection({
      type: "timeline",
      title: selectedCourses.length ? "Datas importantes para sua busca" : "Calendário de inscrição 2027.1",
      intro: selectedCourses.length ? "Separei os prazos e datas disponíveis para os cursos relacionados à sua busca." : "O período previsto de inscrição aparece abaixo por modalidade de ingresso.",
      layout: "list",
      items: timelineItems,
      actions: []
    });

    if (sig.asksVestibularSpecific) {
      const details = vestibularDetailsItems();
      if (details.length) {
        addSection({
          type: "admission_details",
          title: "Como funciona o Vestibular FGV",
          intro: "Veja o essencial sobre a prova, a inscrição e a preparação para essa forma de ingresso.",
          layout: "cards",
          items: details,
          actions: []
        });
      }

      const prepItems = safeArray(data.materials).filter((item) => normalize(item.label || item.title).includes("prova") || normalize(item.label || item.title).includes("gabarito") || normalize(item.label || item.title).includes("edital"));
      if (prepItems.length) {
        addSection({
          type: "prep_materials",
          title: "Prepare-se para o Vestibular FGV",
          intro: "Use provas anteriores, gabaritos e materiais do processo seletivo para organizar seus estudos.",
          layout: "cards",
          items: prepItems.slice(0, 4),
          actions: []
        });
      }

      const eventItems = allEvents().filter((event) => (event.status || "active") === "active").slice(0, 3);
      if (eventItems.length) {
        addSection({
          type: "events",
          title: "Conheça a FGV de perto",
          intro: "Enquanto acompanha a abertura das inscrições, você pode participar de eventos da graduação e conhecer melhor os cursos.",
          layout: "list",
          items: eventItems,
          actions: []
        });
      }
    } else {
      addSection({
        type: "admission_options",
        title: "Formas de ingresso relacionadas",
        intro: "Veja as modalidades previstas para o processo seletivo e escolha qual caminho combina melhor com seu perfil.",
        layout: "cards",
        items: admissionItems(message, selectedCourses, selectedAdmissions.map((item) => item.id)),
        actions: []
      });
    }

    if (!selectedCourses.length && !sig.asksVestibularSpecific) {
      addSection({
        type: "course_cards",
        title: "Enquanto isso, conheça os cursos",
        intro: "Você também pode explorar as opções de graduação por cidade antes da abertura das inscrições.",
        layout: "tabs_by_city",
        items: representativeCourses(),
        actions: []
      });
    }
  }

  requestedSections.forEach((section) => {
    if (section.type === "course_cards") {
      const courses = matchCoursesFromText(message, section.courseIds, cityHints);
      if (courses.length) {
        selectedCourses = selectedCourses.length ? selectedCourses : courses;
        addSection({ ...sectionBase(section, "course_cards", "Cursos relacionados", "Veja os cursos que mais se aproximam do que você buscou.", courses.length > 1 ? "tabs_by_city" : "cards"), items: courses });
      }
    }

    if (section.type === "course_compare") {
      let courses = matchCoursesFromText(message, section.courseIds, cityHints).slice(0, 3);
      if (courses.length < 2) {
        courses = safeArray(data.courses).filter((course) => ["administracao-empresas-sp", "administracao-publica-sp", "administracao-df"].includes(course.id));
      }
      if (courses.length >= 2) addSection({ ...sectionBase(section, "course_compare", "Compare as opções", "Veja diferenças entre cursos, cidades e formas de ingresso."), items: courses.slice(0, 3) });
    }

    if (section.type === "admission_options") {
      addSection({ ...sectionBase(section, "admission_options", "Formas de ingresso", "Confira as modalidades relacionadas à sua busca."), items: admissionItems(message, selectedCourses, section.admissionTypeIds) });
    }

    if (section.type === "timeline") {
      const items = buildTimelineItems(message, selectedCourses, section.admissionTypeIds);
      if (items.length) addSection({ ...sectionBase(section, "timeline", "Datas importantes", "Veja os prazos e marcos disponíveis para sua busca.", "list"), items });
    }

    if (section.type === "events") {
      let items = [];
      if (sig.asksEvent) items = findByIds(allEvents(), section.eventIds);
      if (!items.length && cityHints.length) items = activeEventsByCities(cityHints);
      if (!items.length && specificCourseContext()) items = activeEventsForCourses(selectedCourses);
      if (!items.length && sig.asksEvent) items = allEvents().filter((event) => (event.status || "active") === "active").slice(0, 5);
      if (items.length && shouldShowCourseContextEvents(message, selectedCourses, cityHints)) addSection({ ...sectionBase(section, "events", cityHints.length ? `Conheça a FGV de perto em ${items[0].city}` : specificCourseContext() && selectedCourses[0] ? `Conheça a FGV de perto em ${selectedCourses[0].city}` : "Eventos da graduação", "Eventos são uma forma de conhecer os cursos, conversar com a FGV e viver um pouco da experiência universitária antes de decidir.", "list"), items });
    }

    if (section.type === "scholarships") {
      let items = findByIds(data.scholarships?.programs || [], section.scholarshipIds);
      if (!items.length) items = safeArray(data.scholarships?.programs);
      if (items.length) addSection({ ...sectionBase(section, "scholarships", "Bolsas de estudo", data.scholarships?.intro || "Conheça modalidades de bolsa disponíveis na graduação."), items: items.slice(0, 5) });
    }

    if (section.type === "course_differentials") {
      const items = courseDifferentials(selectedCourses);
      if (items.length) addSection({ ...sectionBase(section, "course_differentials", "Diferenciais do curso", selectedCourses[0]?.courseDifferentialsIntro || "Veja oportunidades e características que fazem parte da experiência do curso."), items });
    }

    if (section.type === "school_recognitions") {
      const items = schoolRecognitions(selectedCourses);
      if (items.length) addSection({ ...sectionBase(section, "school_recognitions", "Reconhecimentos da escola", "Diferenciais acadêmicos e institucionais ligados à escola responsável pelo curso."), items });
    }

    if (section.type === "prep_materials") {
      let items = findByIds(data.materials, section.materialIds);
      if (!items.length) items = safeArray(data.materials).filter((item) => normalize(item.label || item.title).includes("prova") || normalize(item.label || item.title).includes("gabarito") || normalize(item.label || item.title).includes("edital"));
      if (items.length) addSection({ ...sectionBase(section, "prep_materials", "Prepare-se para o processo seletivo", "Encontre materiais úteis para organizar seus estudos.", "cards"), items: items.slice(0, 4) });
    }

    if (section.type === "admission_details") {
      const items = vestibularDetailsItems();
      if (items.length) addSection({ ...sectionBase(section, "admission_details", "Como funciona o Vestibular FGV", "Veja o essencial sobre a prova, a inscrição e a preparação para essa forma de ingresso.", "cards"), items });
    }

    if (section.type === "warning" && !sig.asksDate && !sig.asksCourse && !sig.asksAdmission && !sig.asksScholarship && !sig.asksEvent) {
      addSection({ ...sectionBase(section, "warning", "Não encontrei esse caminho no Vestibular FGV", "Tente buscar por cursos, formas de ingresso, bolsas, provas, eventos ou inscrição.", "single"), items: safeArray(section.textItems).map((text) => ({ text: cleanCopy(text) })) });
    }
  });

  if (sig.asksCourse && selectedCourses.length && !resolved.some((section) => section.type === "course_cards") && !sig.asksDate) {
    addSection({ type: "course_cards", title: selectedCourses.length === safeArray(data.courses).length ? "Cursos por cidade" : "Cursos relacionados", intro: selectedCourses.length === safeArray(data.courses).length ? "Explore os cursos disponíveis em cada cidade." : "Separei as opções mais próximas do que você procura.", layout: selectedCourses.length > 1 ? "tabs_by_city" : "cards", items: selectedCourses, actions: [] });
  }

  if ((sig.asksAdmission || sig.asksDate) && !resolved.some((section) => section.type === "admission_options") && !selectedCourses.length) {
    addSection({ type: "admission_options", title: "Formas de ingresso", intro: "Veja as modalidades e períodos informados para este processo seletivo.", layout: "cards", items: admissionItems(message, selectedCourses, selectedAdmissions.map((item) => item.id)), actions: [] });
  }

  if (broadCourseContext() && !resolved.some((section) => section.type === "course_compare") && normalize(message).includes("administracao")) {
    const compareCourses = safeArray(data.courses).filter((course) => ["administracao-empresas-sp", "administracao-publica-sp", "administracao-rj", "administracao-df", "administracao-publica-df"].includes(course.id)).slice(0, 4);
    if (compareCourses.length >= 2) addSection({ type: "course_compare", title: "Administração: entenda as diferenças", intro: "Administração de Empresas e Administração Pública têm caminhos diferentes. Compare cidade, escola, duração e formas de ingresso antes de decidir.", layout: "table", items: compareCourses, actions: [] });
  }

  if (broadCourseContext() && !resolved.some((section) => section.type === "admission_options")) {
    addSection({ type: "admission_options", title: "Como você pode entrar", intro: "Depois de escolher um curso, vale entender quais modalidades de ingresso combinam com seu momento.", layout: "cards", items: admissionItems("formas de ingresso", [], selectedAdmissions.map((item) => item.id)).slice(0, 4), actions: [] });
  }

  if (specificCourseContext() && (sig.asksDifferentials || !broadCourseContext()) && selectedCourses.length && !resolved.some((section) => section.type === "course_differentials")) {
    const items = courseDifferentials(selectedCourses);
    if (items.length) addSection({ type: "course_differentials", title: "Diferenciais do curso", intro: selectedCourses[0]?.courseDifferentialsIntro || "Veja oportunidades e características que fazem parte da experiência do curso.", layout: "cards", items, actions: [] });
  }

  if (specificCourseContext() && sig.asksDifferentials && selectedCourses.length && !resolved.some((section) => section.type === "school_recognitions")) {
    const items = schoolRecognitions(selectedCourses);
    if (items.length) addSection({ type: "school_recognitions", title: "Reconhecimentos da escola", intro: "Diferenciais acadêmicos e institucionais ligados à escola responsável pelo curso.", layout: "cards", items, actions: [] });
  }

  if ((sig.asksCourse || sig.asksEvent) && selectedCourses.length && !resolved.some((section) => section.type === "events") && !sig.asksDate && shouldShowCourseContextEvents(message, selectedCourses, cityHints)) {
    let items = cityHints.length ? activeEventsByCities(cityHints) : activeEventsForCourses(selectedCourses);
    if (!items.length && sig.asksEvent) items = allEvents().filter((event) => (event.status || "active") === "active").slice(0, 5);
    if (items.length) addSection({ type: "events", title: cityHints.length ? `Conheça a FGV de perto em ${items[0].city}` : `Conheça a FGV de perto em ${selectedCourses[0].city}`, intro: "Eventos são uma forma de conhecer os cursos, conversar com a FGV e viver um pouco da experiência universitária antes de decidir.", layout: "list", items, actions: [] });
  }

  if (sig.asksScholarship && !resolved.some((section) => section.type === "scholarships")) {
    const items = safeArray(data.scholarships?.programs).slice(0, 5);
    if (items.length) addSection({ type: "scholarships", title: "Bolsas de estudo", intro: data.scholarships?.intro || "Conheça modalidades de bolsa disponíveis na graduação.", layout: "cards", items, actions: [] });
  }

  if (sig.asksVestibularSpecific && !resolved.some((section) => section.type === "admission_details")) {
    const items = vestibularDetailsItems();
    if (items.length) addSection({ type: "admission_details", title: "Como funciona o Vestibular FGV", intro: "Veja o essencial sobre a prova, a inscrição e a preparação para essa forma de ingresso.", layout: "cards", items, actions: [] });
  }

  if (sig.asksVestibularSpecific && !resolved.some((section) => section.type === "prep_materials")) {
    const items = safeArray(data.materials).filter((item) => normalize(item.label || item.title).includes("prova") || normalize(item.label || item.title).includes("gabarito") || normalize(item.label || item.title).includes("edital"));
    if (items.length) addSection({ type: "prep_materials", title: "Prepare-se para o Vestibular FGV", intro: "Use provas anteriores, gabaritos e materiais do processo seletivo para organizar seus estudos.", layout: "cards", items: items.slice(0, 4), actions: [] });
  }

  const visibleTypes = resolved.map((section) => section.type);
  const actions = buildNextActions(message, selectedCourses, visibleTypes);
  const shouldShowLead = Boolean(plan.leadCapture?.show || sig.asksLead || (sig.asksDate && safeArray(data.admissionTypes).some((item) => normalize(item.status).includes("breve"))));

  if (shouldShowLead) {
    addSection({
      type: "lead_form",
      title: plan.leadCapture?.title || "Receba novidades sobre sua busca",
      intro: plan.leadCapture?.description || "Deixe seu nome e e-mail para acompanhar atualizações sobre inscrição, curso ou forma de ingresso.",
      layout: "form",
      items: [],
      actions: []
    });
  }

  if (actions.length) {
    let nextTitle = "Quer seguir por onde agora?";
    let nextIntro = "Posso te ajudar a avançar por alguns caminhos.";
    if (sig.asksVestibularSpecific || sig.asksPrep) {
      nextTitle = "Quer se preparar para o Vestibular FGV?";
      nextIntro = "Você pode ver provas anteriores, acompanhar datas ou conhecer os cursos antes de decidir.";
    } else if (sig.asksDate) {
      nextTitle = "Enquanto as inscrições não abrem";
      nextIntro = "Você pode conhecer cursos, entender as formas de ingresso ou receber um aviso sobre o período de inscrição.";
    } else if (broadCourseContext()) {
      nextTitle = "Quer ajuda para escolher?";
      nextIntro = "Posso comparar opções, explicar formas de ingresso ou mostrar bolsas que podem fazer diferença na sua decisão.";
    } else if (specificCourseContext()) {
      nextTitle = "Quer avançar nesse curso?";
      nextIntro = "Veja como entrar, compare com outra opção ou conheça experiências ligadas à cidade do curso.";
    }
    addSection({
      type: "next_step",
      title: nextTitle,
      intro: nextIntro,
      layout: "chips",
      items: actions,
      actions
    });
  }

  return resolved.filter((section) => safeArray(section.items).length || ["lead_form", "next_step", "warning"].includes(section.type));
}

function rewriteForKnownData(plan, message, sections) {
  const sig = querySignals(message);
  const q = sig.q;
  const firstAdmission = matchAdmissionTypes(message)[0] || safeArray(data.admissionTypes)[0];
  const firstPeriod = firstAdmission ? formatPeriod(firstAdmission.startDate, firstAdmission.endDate) : generalAdmissionPeriod();
  const normalized = { ...plan };

  normalized.pageTitle = cleanCopy(plan.pageTitle || "Caminho sugerido");
  normalized.answer = cleanCopy(plan.answer || "Separei as informações mais úteis para você continuar.");

  if (sig.asksDate && firstPeriod) {
    if (sig.asksVestibularSpecific) {
      normalized.pageTitle = "Datas do Vestibular FGV 2027.1";
      normalized.answer = `As inscrições para o Vestibular FGV estão previstas para ${firstPeriod}. A abertura ainda não aconteceu, mas o período já está indicado. Abaixo, organizei as datas, como funciona a prova, materiais para estudar e caminhos para continuar.`;
    } else {
      normalized.pageTitle = q.includes("2027") || q.includes("processo seletivo")
        ? "Inscrições para o processo seletivo 2027.1"
        : "Datas de inscrição";
      normalized.answer = `As inscrições estão previstas para ${firstPeriod}. A abertura ainda não aconteceu, mas o período já está indicado. Veja abaixo as datas e caminhos relacionados ao que você procura.`;
    }
  }

  if (sig.asksCourse && !sig.asksDate && !sig.asksCompare) {
    const courses = matchCoursesFromText(message, plan.entities?.courseIds || plan.entities?.courses || [], plan.entities?.cities);
    if (courses.length === 1) {
      normalized.pageTitle = courseName(courses[0]);
      normalized.answer = cleanCopy(plan.answer || `Encontrei o curso de ${courseName(courses[0])} em ${courses[0].city}. Abaixo, você vê as informações principais e alguns caminhos para continuar.`);
    }
  }

  // Última limpeza para impedir referências a outro site ou página externa.
  normalized.pageTitle = cleanCopy(normalized.pageTitle);
  normalized.answer = cleanCopy(normalized.answer);
  normalized.sections = safeArray(sections).map((section) => ({
    ...section,
    title: cleanCopy(section.title || ""),
    intro: cleanCopy(section.intro || ""),
    items: safeArray(section.items).map((item) => {
      const copy = { ...item };
      ["description", "shortDescription", "text", "label", "value", "name", "title"].forEach((key) => {
        if (typeof copy[key] === "string") copy[key] = cleanCopy(copy[key]);
      });
      return copy;
    }),
    actions: safeArray(section.actions).map((item) => ({ ...item, label: cleanCopy(item.label || ""), prompt: item.prompt || "" }))
  }));
  return normalized;
}

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pageTitle", "answer", "intent", "confidence", "entities", "primaryCta", "followUpSuggestions", "leadCapture", "sections"],
  properties: {
    pageTitle: { type: "string" },
    answer: { type: "string" },
    intent: { type: "string", enum: ["conhecer_cursos", "comparar_cursos", "inscricao", "formas_ingresso", "enem", "provas_gabaritos", "agenda_editais", "bolsas", "evento_visita", "resultado", "faq", "fora_escopo"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    entities: {
      type: "object",
      additionalProperties: false,
      required: ["courseIds", "cities", "admissionTypeIds", "needsLead"],
      properties: {
        courseIds: { type: "array", items: { type: "string" } },
        cities: { type: "array", items: { type: "string" } },
        admissionTypeIds: { type: "array", items: { type: "string" } },
        needsLead: { type: "boolean" }
      }
    },
    primaryCta: {
      type: "object",
      additionalProperties: false,
      required: ["label", "prompt"],
      properties: { label: { type: "string" }, prompt: { type: "string" } }
    },
    followUpSuggestions: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
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
        required: ["type", "title", "intro", "layout", "courseIds", "admissionTypeIds", "materialIds", "eventIds", "scholarshipIds", "textItems"],
        properties: {
          type: { type: "string", enum: ["course_cards", "course_compare", "admission_options", "events", "scholarships", "course_differentials", "school_recognitions", "timeline", "prep_materials", "admission_details", "next_step", "lead_form", "warning"] },
          title: { type: "string" },
          intro: { type: "string" },
          layout: { type: "string", enum: ["cards", "tabs_by_city", "list", "table", "single", "form", "chips"] },
          courseIds: { type: "array", items: { type: "string" } },
          admissionTypeIds: { type: "array", items: { type: "string" } },
          materialIds: { type: "array", items: { type: "string" } },
          eventIds: { type: "array", items: { type: "string" } },
          scholarshipIds: { type: "array", items: { type: "string" } },
          textItems: { type: "array", items: { type: "string" } }
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
A pessoa candidata escreveu uma busca em linguagem natural. Sua tarefa é definir a melhor experiência de página: título, resposta inicial, seções e próximos caminhos.

Regras obrigatórias:
- Responda apenas com JSON válido no schema.
- Use somente IDs que aparecem na BASE_DO_SITE.
- Não invente prazos, valores, vagas, regras, reconhecimentos, bolsas ou eventos.
- Trate esta interface como o próprio site do Vestibular FGV. Nunca escreva "consulte", "acesse", "página oficial", "site oficial", "página do Vestibular", "abrir site", "ver página" nem qualquer frase que pareça mandar o usuário para outro site ou para outra página. Use "veja abaixo", "nesta página" ou apresente a informação diretamente.
- Não escreva como mecanismo de busca. Evite "resultado da busca", "sua busca", "a partir desta busca" e linguagem de sistema. Escreva como uma conversa útil com o candidato.
- O texto deve parecer interface final para vestibulandos: claro, humano, útil, sem mencionar IA, JSON, componente, intenção, confiança, protótipo ou sistema.
- A resposta inicial deve explicar o caminho encontrado e antecipar o que a pessoa pode fazer em seguida, sem ser seca.

Matriz de navegação por intenção:
1. Se a pessoa pergunta genericamente por cursos, cursos por cidade ou por uma área ampla:
   - Use course_cards como primeiro bloco.
   - Se não houver cidade, organize por cidade.
   - Não use course_differentials nem school_recognitions.
   - Não use events, exceto se a pessoa pedir eventos ou mencionar uma cidade.
   - Ofereça continuidade para comparar cursos, entender formas de ingresso, ver bolsas ou conhecer eventos.
2. Se a pessoa pergunta por um curso específico com cidade clara, por exemplo "Administração de Empresas em São Paulo":
   - Use course_cards ou course_compare se fizer sentido.
   - Pode usar course_differentials apenas se houver exatamente um curso identificado e esse curso tiver diferenciais no JSON.
   - Pode usar school_recognitions apenas se houver exatamente um curso identificado.
   - Pode usar events da cidade desse curso.
3. Se a pessoa pergunta "curso de administração" sem cidade clara:
   - Trate como exploração ampla de opções de Administração.
   - Mostre cursos por cidade.
   - Compare Administração de Empresas e Administração Pública quando houver dados.
   - Não mostre diferenciais da FGV EAESP, porque eles pertencem apenas a Administração de Empresas em São Paulo.
4. Quando a pergunta for especificamente sobre Vestibular FGV, data do vestibular, prova do vestibular ou inscrição no vestibular:
   - Trate "Vestibular FGV" como uma forma de ingresso específica, não como sinônimo de todas as modalidades.
   - Não mostre todas as formas de ingresso nesse caso.
   - Use timeline primeiro, depois admission_details, prep_materials e events quando houver.
   - Se a base tiver startDate e endDate, cite o período explicitamente no answer.
5. Para pergunta ampla sobre datas, inscrição, prazo ou processo seletivo:
   - Use timeline primeiro.
   - Depois use admission_options e course_cards quando for útil.
   - Se a base tiver startDate e endDate, cite o período explicitamente no answer.
6. Para pergunta sobre bolsa, inclua scholarships.
7. Para pergunta sobre preparação, prova, gabarito ou Vestibular FGV, inclua prep_materials quando houver materiais úteis na base.
8. Use leadCapture.show=true quando a pessoa pedir aviso, quando perguntar por abertura de inscrição, ou quando o status estiver em breve.
9. Nunca termine uma renderização sem oferecer alguma continuidade útil para a pessoa. Use next_step com poucas opções contextuais, variadas e relacionadas ao que apareceu na página.
10. Se o pedido estiver fora do escopo do Vestibular FGV, use warning e ofereça caminhos de cursos, formas de ingresso, bolsas, eventos ou provas.

BASE_DO_SITE:
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
        temperature: 0.25,
        text: { format: { type: "json_schema", name: "fgv_generative_ui_v2", strict: true, schema: RESPONSE_SCHEMA } }
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
    const normalized = rewriteForKnownData(plan, message, sections);

    return res.status(200).json({
      ...normalized,
      debug: { mode: "openai", model, renderer: "sections_v2", noFallback: true }
    });
  } catch (error) {
    return res.status(502).json({ error: "Não foi possível gerar a resposta com a OpenAI.", mode: "openai_exception", details: error.message });
  }
}

module.exports = handler;
module.exports.config = { maxDuration: 20 };
