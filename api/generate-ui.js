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
    period: formatPeriod(item.startDate, item.endDate)
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
  const direct = findByIds(data.admissionTypes, ids);
  if (direct.length) return direct;
  let matches = safeArray(data.admissionTypes).filter((item) => {
    const label = normalize(item.label || item.name || "");
    if (q.includes("enem") && label.includes("enem")) return true;
    if (q.includes("vestibular") && label.includes("vestibular")) return true;
    if (q.includes("internacional") && label.includes("internacional")) return true;
    if (q.includes("transfer") && label.includes("transfer")) return true;
    if (q.includes("demanda") && label.includes("demanda")) return true;
    if ((q.includes("olimpiada") || q.includes("olimpíada")) && label.includes("olimpi")) return true;
    return false;
  });
  if (!matches.length && (querySignals(message).asksDate || querySignals(message).asksAdmission)) {
    matches = safeArray(data.admissionTypes);
  }
  return matches.slice(0, 6);
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

function representativeCourses(limit = 6) {
  const seen = new Set();
  const preferredCities = ["São Paulo", "Rio de Janeiro", "Brasília"];
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


function courseDifferentials(courses = []) {
  const items = [];
  safeArray(courses).slice(0, 2).forEach((course) => {
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
  const schoolIds = new Set(safeArray(courses).map((course) => course.schoolId).filter(Boolean));
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
  const mainCourse = courses[0];
  const visible = new Set(visibleTypes);

  if (sig.asksDate || sig.asksAdmission) {
    actions.push(action("Ver cursos disponíveis", "quais cursos a FGV oferece?"));
    actions.push(action("Comparar formas de ingresso", "qual a diferença entre Vestibular FGV, ENEM e processo internacional?"));
    actions.push(action("Receber aviso de inscrição", "quero receber aviso quando as inscrições abrirem", "primary"));
    return actions.slice(0, 3);
  }

  if (mainCourse && !visible.has("admission_options")) actions.push(action("Ver formas de ingresso", `quais formas de ingresso existem para ${courseName(mainCourse)} em ${mainCourse.city}?`, "primary"));
  if (mainCourse && activeEventsForCourses([mainCourse]).length && !visible.has("events")) actions.push(action("Conhecer eventos na cidade", `quais eventos da graduação existem em ${mainCourse.city}?`));
  if (mainCourse && !visible.has("course_differentials")) actions.push(action("Ver diferenciais do curso", `quais são os diferenciais de ${courseName(mainCourse)} em ${mainCourse.city}?`));
  if (!sig.asksCompare) actions.push(action("Comparar cursos", "quero comparar cursos"));
  if (!sig.asksScholarship && actions.length < 4) actions.push(action("Ver bolsas de estudo", "quais bolsas de estudo a FGV oferece?"));
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
  const selectedAdmissions = matchAdmissionTypes(message, plan.entities?.admissionTypeIds || plan.entities?.admissionTypes || []);
  const resolved = [];
  const addSection = (section) => {
    if (!section) return;
    if (["course_cards", "timeline", "admission_options", "events", "scholarships", "course_differentials", "school_recognitions", "course_compare", "prep_materials", "warning", "lead_form"].includes(section.type)) {
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

    addSection({
      type: "admission_options",
      title: "Formas de ingresso relacionadas",
      intro: "Veja as modalidades previstas para o processo seletivo e escolha qual caminho combina melhor com seu perfil.",
      layout: "cards",
      items: admissionItems(message, selectedCourses, selectedAdmissions.map((item) => item.id)),
      actions: []
    });

    if (!selectedCourses.length) {
      addSection({
        type: "course_cards",
        title: "Enquanto isso, conheça os cursos",
        intro: "Você também pode explorar as opções de graduação por cidade antes da abertura das inscrições.",
        layout: "cards",
        items: representativeCourses(6),
        actions: []
      });
    }
  }

  requestedSections.forEach((section) => {
    if (section.type === "course_cards") {
      const courses = matchCoursesFromText(message, section.courseIds, cityHints);
      if (courses.length) {
        selectedCourses = selectedCourses.length ? selectedCourses : courses;
        addSection({ ...sectionBase(section, "course_cards", "Cursos relacionados", "Veja os cursos que mais se aproximam do que você buscou."), items: courses });
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
      let items = findByIds(allEvents(), section.eventIds);
      if (!items.length && selectedCourses.length) items = activeEventsForCourses(selectedCourses);
      if (!items.length && cityHints.length) items = activeEventsByCities(cityHints);
      if (!items.length && sig.asksEvent) items = allEvents().filter((event) => (event.status || "active") === "active").slice(0, 5);
      if (items.length) addSection({ ...sectionBase(section, "events", selectedCourses[0] ? `Conheça a FGV de perto em ${selectedCourses[0].city}` : "Eventos da graduação", "Veja eventos para viver a experiência universitária, conhecer cursos e tirar dúvidas antes da inscrição.", "list"), items });
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

    if (section.type === "warning" && !sig.asksDate && !sig.asksCourse && !sig.asksAdmission && !sig.asksScholarship && !sig.asksEvent) {
      addSection({ ...sectionBase(section, "warning", "Não encontrei esse caminho no Vestibular FGV", "Tente buscar por cursos, formas de ingresso, bolsas, provas, eventos ou inscrição.", "single"), items: safeArray(section.textItems).map((text) => ({ text: cleanCopy(text) })) });
    }
  });

  if (sig.asksCourse && selectedCourses.length && !resolved.some((section) => section.type === "course_cards") && !sig.asksDate) {
    addSection({ type: "course_cards", title: "Cursos relacionados", intro: "Encontrei estas opções a partir da sua busca.", layout: "cards", items: selectedCourses, actions: [] });
  }

  if ((sig.asksAdmission || sig.asksDate) && !resolved.some((section) => section.type === "admission_options") && !selectedCourses.length) {
    addSection({ type: "admission_options", title: "Formas de ingresso", intro: "Veja as modalidades e períodos informados para este processo seletivo.", layout: "cards", items: admissionItems(message, selectedCourses, selectedAdmissions.map((item) => item.id)), actions: [] });
  }

  if ((sig.asksDifferentials || sig.asksCourse) && selectedCourses.length && !resolved.some((section) => section.type === "course_differentials")) {
    const items = courseDifferentials(selectedCourses);
    if (items.length) addSection({ type: "course_differentials", title: "Diferenciais do curso", intro: selectedCourses[0]?.courseDifferentialsIntro || "Veja oportunidades e características que fazem parte da experiência do curso.", layout: "cards", items, actions: [] });
  }

  if (sig.asksDifferentials && selectedCourses.length && !resolved.some((section) => section.type === "school_recognitions")) {
    const items = schoolRecognitions(selectedCourses);
    if (items.length) addSection({ type: "school_recognitions", title: "Reconhecimentos da escola", intro: "Diferenciais acadêmicos e institucionais ligados à escola responsável pelo curso.", layout: "cards", items, actions: [] });
  }

  if ((sig.asksCourse || sig.asksEvent) && selectedCourses.length && !resolved.some((section) => section.type === "events") && !sig.asksDate) {
    const items = activeEventsForCourses(selectedCourses);
    if (items.length) addSection({ type: "events", title: `Conheça a FGV de perto em ${selectedCourses[0].city}`, intro: "Há eventos da graduação na cidade do curso. Pode ser uma boa forma de viver a experiência universitária antes de decidir.", layout: "list", items, actions: [] });
  }

  if (sig.asksScholarship && !resolved.some((section) => section.type === "scholarships")) {
    const items = safeArray(data.scholarships?.programs).slice(0, 5);
    if (items.length) addSection({ type: "scholarships", title: "Bolsas de estudo", intro: data.scholarships?.intro || "Conheça modalidades de bolsa disponíveis na graduação.", layout: "cards", items, actions: [] });
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
    addSection({
      type: "next_step",
      title: "Continue por aqui",
      intro: "Escolha um caminho para seguir a partir desta busca.",
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

  normalized.pageTitle = cleanCopy(plan.pageTitle || "Resultado da sua busca");
  normalized.answer = cleanCopy(plan.answer || "Separei as informações mais relevantes para sua busca.");

  if (sig.asksDate && firstPeriod) {
    normalized.pageTitle = q.includes("2027") || q.includes("processo seletivo") || q.includes("vestibular")
      ? "Inscrições para o processo seletivo 2027.1"
      : "Datas de inscrição";
    normalized.answer = `As inscrições estão previstas para ${firstPeriod}. A abertura ainda não aconteceu, mas o período já está indicado para as modalidades do processo seletivo. Veja abaixo as datas, formas de ingresso e cursos para continuar sua busca.`;
  }

  if (sig.asksCourse && !sig.asksDate && !sig.asksCompare) {
    const courses = matchCoursesFromText(message, plan.entities?.courseIds || plan.entities?.courses || [], plan.entities?.cities);
    if (courses.length === 1) {
      normalized.pageTitle = courseName(courses[0]);
      normalized.answer = cleanCopy(plan.answer || `Encontrei o curso de ${courseName(courses[0])} em ${courses[0].city}. Abaixo, você vê as informações principais e caminhos para continuar.`);
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
          type: { type: "string", enum: ["course_cards", "course_compare", "admission_options", "events", "scholarships", "course_differentials", "school_recognitions", "timeline", "prep_materials", "next_step", "lead_form", "warning"] },
          title: { type: "string" },
          intro: { type: "string" },
          layout: { type: "string", enum: ["cards", "list", "table", "single", "form", "chips"] },
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
- Trate esta interface como o próprio site do Vestibular FGV. Nunca escreva "consulte", "acesse", "página oficial", "site oficial", "página do Vestibular", "abrir site" nem qualquer frase que pareça mandar o usuário para outro site. Use "veja abaixo", "nesta página" ou apresente a informação diretamente.
- O texto deve parecer interface final para vestibulandos: claro, humano, útil, sem mencionar IA, JSON, componente, intenção, confiança, protótipo ou sistema.
- A resposta inicial pode explicar um pouco o caminho encontrado, mas deve ir direto ao ponto.
- Para pergunta sobre datas, inscrição, prazo ou vestibular, use timeline, admission_options e, quando a pergunta for geral, course_cards. Se a base tiver startDate e endDate, cite o período explicitamente no answer, por exemplo "As inscrições estão previstas para 27/07/2026 a 16/09/2026".
- Para pergunta sobre curso/cidade, comece com course_cards ou course_compare; inclua course_differentials quando houver interesse em diferenciais ou quando o curso tiver diferenciais relevantes.
- Para pergunta sobre curso, se houver evento ativo na mesma cidade, inclua events como caminho contextual, mas com texto natural: "Conheça a FGV de perto".
- Para pergunta sobre bolsa, inclua scholarships.
- Para pergunta sobre preparação, inclua prep_materials.
- Use leadCapture.show=true quando a pessoa pedir aviso, quando perguntar por abertura de inscrição, ou quando o status estiver em breve.
- Inclua next_step apenas quando ele trouxer continuidade útil, com tom natural e poucas opções.
- Se o pedido estiver fora do escopo do Vestibular FGV, use warning e ofereça caminhos de cursos, formas de ingresso, bolsas, eventos ou provas.

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
