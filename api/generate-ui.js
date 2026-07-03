const data = require("../data/vestibular-content.json");

function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function buildNextStep(intent, stage, normalizedMessage = "") {
  if (intent === "comparar_cursos") {
    return {
      title: "Confira como ingressar",
      description: "Depois de comparar os cursos, veja quais formas de ingresso estão disponíveis para a opção que mais combina com você.",
      actionLabel: "Ver formas de ingresso",
      actionType: "ask_followup",
      prompt: "quais formas de ingresso posso usar?",
      url: ""
    };
  }

  if (intent === "provas_gabaritos") {
    return {
      title: "Continue sua preparação",
      description: "Acesse provas anteriores, gabaritos e o edital vigente para organizar seus estudos.",
      actionLabel: "Ver edital e provas",
      actionType: "open_link",
      prompt: "",
      url: "https://vestibular.fgv.br/processo-seletivo"
    };
  }

  if (intent === "enem" || normalizedMessage.includes("em breve") || normalizedMessage.includes("fechad") || normalizedMessage.includes("avis")) {
    return {
      title: "Receba aviso sobre essa opção",
      description: "Deixe seu contato para acompanhar novidades sobre o curso, a cidade ou a forma de ingresso do seu interesse.",
      actionLabel: "Quero receber aviso",
      actionType: "show_form",
      prompt: "",
      url: ""
    };
  }

  if (intent === "inscricao" || intent === "agenda_editais" || stage === "decisao") {
    return {
      title: "Veja o processo seletivo",
      description: "Confira o edital, os prazos e as orientações oficiais antes de iniciar sua inscrição.",
      actionLabel: "Abrir processo seletivo",
      actionType: "open_link",
      prompt: "",
      url: "https://vestibular.fgv.br/processo-seletivo"
    };
  }

  if (intent === "fora_escopo") {
    return {
      title: "Tente uma busca sobre o Vestibular FGV",
      description: "Você pode buscar por cursos, formas de ingresso, inscrições, editais, provas anteriores ou resultados.",
      actionLabel: "Ver cursos",
      actionType: "open_link",
      prompt: "",
      url: "https://vestibular.fgv.br/cursos"
    };
  }

  return {
    title: "Compare suas opções",
    description: "Você pode comparar cursos, cidades e formas de ingresso antes de decidir o próximo passo.",
    actionLabel: "Comparar cursos",
    actionType: "ask_followup",
    prompt: "quero comparar cursos",
    url: ""
  };
}

function buildLeadCapture(intent, normalizedMessage = "", courses = [], cities = []) {
  const shouldShow =
    intent === "enem" ||
    normalizedMessage.includes("em breve") ||
    normalizedMessage.includes("fechad") ||
    normalizedMessage.includes("nao abriu") ||
    normalizedMessage.includes("não abriu") ||
    normalizedMessage.includes("avis");

  return {
    show: shouldShow,
    reason: shouldShow ? "Interesse em receber atualização sobre curso, cidade ou forma de ingresso." : "",
    title: shouldShow ? "Receber aviso quando abrir" : "Captura de interesse",
    description: shouldShow ? "Deixe seus dados para receber novidades sobre o curso, a cidade ou a forma de ingresso do seu interesse." : "",
    interestCourse: courses[0] || "",
    interestCity: cities[0] || ""
  };
}

function enrichPlan(plan, message) {
  const q = normalize(message);
  const courses = plan.entities?.courses || [];
  const cities = plan.entities?.cities || [];
  const components = [...new Set(plan.components || [])];
  const leadCapture = plan.leadCapture || buildLeadCapture(plan.intent, q, courses, cities);
  const nextStep = plan.nextStep || buildNextStep(plan.intent, plan.stage, q);

  if (!components.includes("next_steps")) components.push("next_steps");
  if (leadCapture.show && !components.includes("lead_form")) components.push("lead_form");

  return {
    ...plan,
    components,
    nextStep,
    leadCapture
  };
}

function localFallback(message) {
  const q = normalize(message);
  const cities = [];
  if (q.includes("sao paulo") || q.includes("sp")) cities.push("São Paulo");
  if (q.includes("rio") || q.includes("rj")) cities.push("Rio de Janeiro");
  if (q.includes("brasilia") || q.includes("df")) cities.push("Brasília");

  const courseHits = data.courses
    .filter((course) => {
      const haystack = normalize(`${course.name} ${course.displayName} ${course.school} ${course.tags.join(" ")}`);
      return haystack.split(" ").some((token) => token.length > 3 && q.includes(token)) || q.includes(normalize(course.name));
    })
    .map((course) => course.displayName);

  let intent = "conhecer_cursos";
  let stage = "descoberta";
  let components = ["intent_summary", "course_cards", "source_links", "next_steps"];
  let answer = "Separei cursos e caminhos relacionados ao que você escreveu.";

  if (q.includes("enem")) {
    intent = "enem";
    stage = "decisao";
    components = ["intent_summary", "admission_options", "course_cards", "source_links", "next_steps"];
    answer = "Você quer entender como usar o ENEM. Vou priorizar modalidades de ingresso e cursos relacionados.";
  }
  if (q.includes("inscri") || q.includes("prazo") || q.includes("edital") || q.includes("valor")) {
    intent = "inscricao";
    stage = "decisao";
    components = ["intent_summary", "timeline", "admission_options", "course_cards", "source_links", "next_steps"];
    answer = "Você está em uma etapa de decisão. Vou destacar prazos, formas de ingresso, edital e próximos passos.";
  }
  if (q.includes("compar") || q.includes("diferenca") || q.includes("diferença")) {
    intent = "comparar_cursos";
    stage = "consideracao";
    components = ["intent_summary", "course_compare", "course_cards", "source_links", "next_steps"];
    answer = "Você quer comparar opções. Montei uma visão lado a lado com os pontos mais úteis para decidir.";
  }
  if (q.includes("prova") || q.includes("gabarito") || q.includes("treinar") || q.includes("estudar")) {
    intent = "provas_gabaritos";
    stage = "preparacao";
    components = ["intent_summary", "prep_materials", "course_cards", "source_links", "next_steps"];
    answer = "Você está buscando preparação. Vou priorizar provas, gabaritos e materiais oficiais.";
  }
  if (q.includes("resultado") || q.includes("matricula") || q.includes("acompanhar")) {
    intent = "resultado";
    stage = "pos_inscricao";
    components = ["intent_summary", "source_links", "next_steps"];
    answer = "Você parece estar no pós-inscrição. Vou priorizar acompanhamento, resultados e matrícula.";
  }
  if (q.includes("visita") || q.includes("evento") || q.includes("conhecer a fgv") || q.includes("experiencia") || q.includes("experiência")) {
    intent = "evento_visita";
    stage = "descoberta";
    components = ["intent_summary", "timeline", "source_links", "next_steps"];
    answer = "Você quer conhecer a FGV antes de decidir. Vou destacar eventos e caminhos para explorar cursos.";
  }

  return enrichPlan({
    intent,
    confidence: 0.55,
    stage,
    entities: {
      courses: [...new Set(courseHits)].slice(0, 4),
      cities,
      admissionTypes: q.includes("enem") ? ["ENEM"] : [],
      needsOfficialCheck: true
    },
    answer,
    components,
    primaryCta: { label: "Ver página oficial", url: data.meta.officialSite },
    followUpSuggestions: [
      "Comparar dois cursos",
      "Ver formas de ingresso",
      "Encontrar provas e gabaritos",
      "Ver cursos por cidade"
    ]
  }, message);
}

const UI_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "intent",
    "confidence",
    "stage",
    "entities",
    "answer",
    "components",
    "primaryCta",
    "followUpSuggestions",
    "nextStep",
    "leadCapture"
  ],
  properties: {
    intent: {
      type: "string",
      enum: [
        "conhecer_cursos",
        "comparar_cursos",
        "inscricao",
        "formas_ingresso",
        "enem",
        "provas_gabaritos",
        "agenda_editais",
        "bolsas",
        "evento_visita",
        "resultado",
        "faq",
        "fora_escopo"
      ]
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    stage: {
      type: "string",
      enum: ["descoberta", "consideracao", "decisao", "preparacao", "pos_inscricao", "indefinida"]
    },
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
    answer: { type: "string" },
    components: {
      type: "array",
      minItems: 2,
      maxItems: 8,
      items: {
        type: "string",
        enum: [
          "intent_summary",
          "course_cards",
          "course_compare",
          "admission_options",
          "timeline",
          "source_links",
          "faq",
          "next_steps",
          "prep_materials",
          "warning",
          "lead_form"
        ]
      }
    },
    primaryCta: {
      type: "object",
      additionalProperties: false,
      required: ["label", "url"],
      properties: {
        label: { type: "string" },
        url: { type: "string" }
      }
    },
    followUpSuggestions: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: { type: "string" }
    },
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
    }
  }
};

async function handleGenerateUi(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const message = String(req.body?.message || "").trim();
  if (!message) {
    return res.status(400).json({ error: "Campo 'message' ausente." });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.api_vestibular;
  if (!apiKey) {
    return res.status(200).json({ ...localFallback(message), debug: { mode: "local_fallback_no_api_key" } });
  }

  const compactData = {
    meta: data.meta,
    citiesAndCourses: data.courses.map((course) => ({
      id: course.id,
      name: course.displayName,
      city: course.city,
      state: course.state,
      school: course.school,
      entry: course.entry,
      duration: course.duration,
      period: course.period,
      tuition: course.tuition,
      admissions: course.admissions,
      admissionDates: course.admissionDates || {},
      examDates: course.examDates || "",
      resultDate: course.resultDate || "",
      summary: course.summary,
      url: course.url,
      tags: course.tags
    })),
    admissionTypes: data.admissionTypes,
    materials: data.materials,
    journeyStages: data.journeyStages
  };

  const instructions = `Você planeja a navegação de uma página do Vestibular FGV.
A pessoa candidata escreveu uma busca em linguagem natural. Interprete o objetivo, reconheça curso/cidade/forma de ingresso quando houver e devolva um JSON para a interface montar a resposta.

Regras:
- Use apenas os dados da BASE_OFICIAL enviada abaixo.
- Não invente prazo, valor, vaga, etapa, edital ou regra.
- Quando faltar dado, use entities.needsOfficialCheck=true e indique consulta à página oficial ou edital.
- A resposta deve parecer texto de interface para vestibulando, não explicação técnica do projeto.
- Sempre indique um próximo passo útil em nextStep.
- Use leadCapture.show=true quando a pergunta indicar interesse em curso/modalidade ainda não aberta, ENEM em breve, prazo fechado ou pedido de aviso.
- Se leadCapture.show=true, inclua lead_form em components.
- primaryCta deve apontar para a URL mais útil entre as URLs da base.
- Se o pedido estiver fora do escopo do Vestibular FGV, use intent fora_escopo, stage indefinida, components warning/source_links/next_steps e ofereça caminhos de Vestibular FGV.

Componentes disponíveis:
- intent_summary: resumo inicial da busca
- course_cards: cards de cursos relacionados
- course_compare: comparação entre cursos
- admission_options: formas de ingresso
- timeline: prazos, agenda, edital e datas disponíveis na base
- prep_materials: provas, gabaritos e materiais de preparação
- source_links: links oficiais
- next_steps: continuidade da jornada
- lead_form: formulário de interesse
- warning: assunto fora do escopo
- faq: dúvidas relacionadas

BASE_OFICIAL:
${JSON.stringify(compactData)}`;

  try {
    const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/+$/, "");
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await fetch(`${baseUrl}/v1/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        instructions,
        input: message,
        store: false,
        temperature: 0.2,
        text: {
          format: {
            type: "json_schema",
            name: "generative_navigation_plan",
            strict: true,
            schema: UI_SCHEMA
          }
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        ...localFallback(message),
        debug: { mode: "local_fallback_openai_error", status: response.status, error: result }
      });
    }

    const text = result.output_text || result.output?.flatMap((item) => item.content || []).find((content) => content.type === "output_text")?.text || "";
    const parsed = JSON.parse(text);

    return res.status(200).json({ ...enrichPlan(parsed, message), debug: { mode: "openai", model } });
  } catch (error) {
    return res.status(200).json({
      ...localFallback(message),
      debug: { mode: "local_fallback_exception", error: error.message }
    });
  }
}

module.exports = handleGenerateUi;
module.exports.config = {
  maxDuration: 10
};
