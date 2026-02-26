/**
 * Client-side translation simulator using keyword/phrase mapping
 * for common negotiation and conversation terms.
 */

// Dictionary: [sourceLang][phrase] = { targetLang: translation }
type PhraseDictionary = Record<string, Record<string, Record<string, string>>>;

const PHRASE_DICTIONARY: PhraseDictionary = {
  es: {
    'hola': { en: 'hello', fr: 'bonjour', de: 'hallo', pt: 'olá', ru: 'привет', zh: '你好', ar: 'مرحبا' },
    'gracias': { en: 'thank you', fr: 'merci', de: 'danke', pt: 'obrigado', ru: 'спасибо', zh: '谢谢', ar: 'شكرا' },
    'por favor': { en: 'please', fr: 's\'il vous plaît', de: 'bitte', pt: 'por favor', ru: 'пожалуйста', zh: '请', ar: 'من فضلك' },
    'acuerdo': { en: 'agreement', fr: 'accord', de: 'Vereinbarung', pt: 'acordo', ru: 'соглашение', zh: '协议', ar: 'اتفاق' },
    'negociación': { en: 'negotiation', fr: 'négociation', de: 'Verhandlung', pt: 'negociação', ru: 'переговоры', zh: '谈判', ar: 'تفاوض' },
    'precio': { en: 'price', fr: 'prix', de: 'Preis', pt: 'preço', ru: 'цена', zh: '价格', ar: 'سعر' },
    'contrato': { en: 'contract', fr: 'contrat', de: 'Vertrag', pt: 'contrato', ru: 'контракт', zh: '合同', ar: 'عقد' },
    'propuesta': { en: 'proposal', fr: 'proposition', de: 'Vorschlag', pt: 'proposta', ru: 'предложение', zh: '提案', ar: 'اقتراح' },
    'reunión': { en: 'meeting', fr: 'réunion', de: 'Treffen', pt: 'reunião', ru: 'встреча', zh: '会议', ar: 'اجتماع' },
    'empresa': { en: 'company', fr: 'entreprise', de: 'Unternehmen', pt: 'empresa', ru: 'компания', zh: '公司', ar: 'شركة' },
    'cliente': { en: 'client', fr: 'client', de: 'Kunde', pt: 'cliente', ru: 'клиент', zh: '客户', ar: 'عميل' },
    'problema': { en: 'problem', fr: 'problème', de: 'Problem', pt: 'problema', ru: 'проблема', zh: '问题', ar: 'مشكلة' },
    'solución': { en: 'solution', fr: 'solution', de: 'Lösung', pt: 'solução', ru: 'решение', zh: '解决方案', ar: 'حل' },
    'importante': { en: 'important', fr: 'important', de: 'wichtig', pt: 'importante', ru: 'важный', zh: '重要', ar: 'مهم' },
    'necesito': { en: 'I need', fr: 'j\'ai besoin', de: 'ich brauche', pt: 'preciso', ru: 'мне нужно', zh: '我需要', ar: 'أحتاج' },
    'quiero': { en: 'I want', fr: 'je veux', de: 'ich möchte', pt: 'quero', ru: 'я хочу', zh: '我想要', ar: 'أريد' },
    'podemos': { en: 'we can', fr: 'nous pouvons', de: 'wir können', pt: 'podemos', ru: 'мы можем', zh: '我们可以', ar: 'يمكننا' },
    'tiempo': { en: 'time', fr: 'temps', de: 'Zeit', pt: 'tempo', ru: 'время', zh: '时间', ar: 'وقت' },
    'dinero': { en: 'money', fr: 'argent', de: 'Geld', pt: 'dinheiro', ru: 'деньги', zh: '钱', ar: 'مال' },
    'trabajo': { en: 'work', fr: 'travail', de: 'Arbeit', pt: 'trabalho', ru: 'работа', zh: '工作', ar: 'عمل' },
  },
  fr: {
    'bonjour': { en: 'hello', es: 'hola', de: 'hallo', pt: 'olá', ru: 'привет', zh: '你好', ar: 'مرحبا' },
    'merci': { en: 'thank you', es: 'gracias', de: 'danke', pt: 'obrigado', ru: 'спасибо', zh: '谢谢', ar: 'شكرا' },
    'accord': { en: 'agreement', es: 'acuerdo', de: 'Vereinbarung', pt: 'acordo', ru: 'соглашение', zh: '协议', ar: 'اتفاق' },
    'négociation': { en: 'negotiation', es: 'negociación', de: 'Verhandlung', pt: 'negociação', ru: 'переговоры', zh: '谈判', ar: 'تفاوض' },
    'prix': { en: 'price', es: 'precio', de: 'Preis', pt: 'preço', ru: 'цена', zh: '价格', ar: 'سعر' },
    'contrat': { en: 'contract', es: 'contrato', de: 'Vertrag', pt: 'contrato', ru: 'контракт', zh: '合同', ar: 'عقد' },
    'proposition': { en: 'proposal', es: 'propuesta', de: 'Vorschlag', pt: 'proposta', ru: 'предложение', zh: '提案', ar: 'اقتراح' },
    'réunion': { en: 'meeting', es: 'reunión', de: 'Treffen', pt: 'reunião', ru: 'встреча', zh: '会议', ar: 'اجتماع' },
    'entreprise': { en: 'company', es: 'empresa', de: 'Unternehmen', pt: 'empresa', ru: 'компания', zh: '公司', ar: 'شركة' },
    'client': { en: 'client', es: 'cliente', de: 'Kunde', pt: 'cliente', ru: 'клиент', zh: '客户', ar: 'عميل' },
    'problème': { en: 'problem', es: 'problema', de: 'Problem', pt: 'problema', ru: 'проблема', zh: '问题', ar: 'مشكلة' },
    'solution': { en: 'solution', es: 'solución', de: 'Lösung', pt: 'solução', ru: 'решение', zh: '解决方案', ar: 'حل' },
    'important': { en: 'important', es: 'importante', de: 'wichtig', pt: 'importante', ru: 'важный', zh: '重要', ar: 'مهم' },
    'je veux': { en: 'I want', es: 'quiero', de: 'ich möchte', pt: 'quero', ru: 'я хочу', zh: '我想要', ar: 'أريد' },
    'nous pouvons': { en: 'we can', es: 'podemos', de: 'wir können', pt: 'podemos', ru: 'мы можем', zh: '我们可以', ar: 'يمكننا' },
    'temps': { en: 'time', es: 'tiempo', de: 'Zeit', pt: 'tempo', ru: 'время', zh: '时间', ar: 'وقت' },
    'argent': { en: 'money', es: 'dinero', de: 'Geld', pt: 'dinheiro', ru: 'деньги', zh: '钱', ar: 'مال' },
    'travail': { en: 'work', es: 'trabajo', de: 'Arbeit', pt: 'trabalho', ru: 'работа', zh: '工作', ar: 'عمل' },
  },
  de: {
    'hallo': { en: 'hello', es: 'hola', fr: 'bonjour', pt: 'olá', ru: 'привет', zh: '你好', ar: 'مرحبا' },
    'danke': { en: 'thank you', es: 'gracias', fr: 'merci', pt: 'obrigado', ru: 'спасибо', zh: '谢谢', ar: 'شكرا' },
    'bitte': { en: 'please', es: 'por favor', fr: 's\'il vous plaît', pt: 'por favor', ru: 'пожалуйста', zh: '请', ar: 'من فضلك' },
    'vereinbarung': { en: 'agreement', es: 'acuerdo', fr: 'accord', pt: 'acordo', ru: 'соглашение', zh: '协议', ar: 'اتفاق' },
    'verhandlung': { en: 'negotiation', es: 'negociación', fr: 'négociation', pt: 'negociação', ru: 'переговоры', zh: '谈判', ar: 'تفاوض' },
    'preis': { en: 'price', es: 'precio', fr: 'prix', pt: 'preço', ru: 'цена', zh: '价格', ar: 'سعر' },
    'vertrag': { en: 'contract', es: 'contrato', fr: 'contrat', pt: 'contrato', ru: 'контракт', zh: '合同', ar: 'عقد' },
    'vorschlag': { en: 'proposal', es: 'propuesta', fr: 'proposition', pt: 'proposta', ru: 'предложение', zh: '提案', ar: 'اقتراح' },
    'treffen': { en: 'meeting', es: 'reunión', fr: 'réunion', pt: 'reunião', ru: 'встреча', zh: '会议', ar: 'اجتماع' },
    'unternehmen': { en: 'company', es: 'empresa', fr: 'entreprise', pt: 'empresa', ru: 'компания', zh: '公司', ar: 'شركة' },
    'kunde': { en: 'client', es: 'cliente', fr: 'client', pt: 'cliente', ru: 'клиент', zh: '客户', ar: 'عميل' },
    'problem': { en: 'problem', es: 'problema', fr: 'problème', pt: 'problema', ru: 'проблема', zh: '问题', ar: 'مشكلة' },
    'lösung': { en: 'solution', es: 'solución', fr: 'solution', pt: 'solução', ru: 'решение', zh: '解决方案', ar: 'حل' },
    'wichtig': { en: 'important', es: 'importante', fr: 'important', pt: 'importante', ru: 'важный', zh: '重要', ar: 'مهم' },
    'ich möchte': { en: 'I want', es: 'quiero', fr: 'je veux', pt: 'quero', ru: 'я хочу', zh: '我想要', ar: 'أريد' },
    'wir können': { en: 'we can', es: 'podemos', fr: 'nous pouvons', pt: 'podemos', ru: 'мы можем', zh: '我们可以', ar: 'يمكننا' },
    'zeit': { en: 'time', es: 'tiempo', fr: 'temps', pt: 'tempo', ru: 'время', zh: '时间', ar: 'وقت' },
    'geld': { en: 'money', es: 'dinero', fr: 'argent', pt: 'dinheiro', ru: 'деньги', zh: '钱', ar: 'مال' },
    'arbeit': { en: 'work', es: 'trabajo', fr: 'travail', pt: 'trabalho', ru: 'работа', zh: '工作', ar: 'عمل' },
  },
  pt: {
    'olá': { en: 'hello', es: 'hola', fr: 'bonjour', de: 'hallo', ru: 'привет', zh: '你好', ar: 'مرحبا' },
    'obrigado': { en: 'thank you', es: 'gracias', fr: 'merci', de: 'danke', ru: 'спасибо', zh: '谢谢', ar: 'شكرا' },
    'acordo': { en: 'agreement', es: 'acuerdo', fr: 'accord', de: 'Vereinbarung', ru: 'соглашение', zh: '协议', ar: 'اتفاق' },
    'negociação': { en: 'negotiation', es: 'negociación', fr: 'négociation', de: 'Verhandlung', ru: 'переговоры', zh: '谈判', ar: 'تفاوض' },
    'preço': { en: 'price', es: 'precio', fr: 'prix', de: 'Preis', ru: 'цена', zh: '价格', ar: 'سعر' },
    'contrato': { en: 'contract', es: 'contrato', fr: 'contrat', de: 'Vertrag', ru: 'контракт', zh: '合同', ar: 'عقد' },
    'proposta': { en: 'proposal', es: 'propuesta', fr: 'proposition', de: 'Vorschlag', ru: 'предложение', zh: '提案', ar: 'اقتراح' },
    'reunião': { en: 'meeting', es: 'reunión', fr: 'réunion', de: 'Treffen', ru: 'встреча', zh: '会议', ar: 'اجتماع' },
    'empresa': { en: 'company', es: 'empresa', fr: 'entreprise', de: 'Unternehmen', ru: 'компания', zh: '公司', ar: 'شركة' },
    'cliente': { en: 'client', es: 'cliente', fr: 'client', de: 'Kunde', ru: 'клиент', zh: '客户', ar: 'عميل' },
    'problema': { en: 'problem', es: 'problema', fr: 'problème', de: 'Problem', ru: 'проблема', zh: '问题', ar: 'مشكلة' },
    'solução': { en: 'solution', es: 'solución', fr: 'solution', de: 'Lösung', ru: 'решение', zh: '解决方案', ar: 'حل' },
    'importante': { en: 'important', es: 'importante', fr: 'important', de: 'wichtig', ru: 'важный', zh: '重要', ar: 'مهم' },
    'quero': { en: 'I want', es: 'quiero', fr: 'je veux', de: 'ich möchte', ru: 'я хочу', zh: '我想要', ar: 'أريد' },
    'podemos': { en: 'we can', es: 'podemos', fr: 'nous pouvons', de: 'wir können', ru: 'мы можем', zh: '我们可以', ar: 'يمكننا' },
    'tempo': { en: 'time', es: 'tiempo', fr: 'temps', de: 'Zeit', ru: 'время', zh: '时间', ar: 'وقت' },
    'dinheiro': { en: 'money', es: 'dinero', fr: 'argent', de: 'Geld', ru: 'деньги', zh: '钱', ar: 'مال' },
    'trabalho': { en: 'work', es: 'trabajo', fr: 'travail', de: 'Arbeit', ru: 'работа', zh: '工作', ar: 'عمل' },
  },
  ru: {
    'привет': { en: 'hello', es: 'hola', fr: 'bonjour', de: 'hallo', pt: 'olá', zh: '你好', ar: 'مرحبا' },
    'спасибо': { en: 'thank you', es: 'gracias', fr: 'merci', de: 'danke', pt: 'obrigado', zh: '谢谢', ar: 'شكرا' },
    'пожалуйста': { en: 'please', es: 'por favor', fr: 's\'il vous plaît', de: 'bitte', pt: 'por favor', zh: '请', ar: 'من فضلك' },
    'соглашение': { en: 'agreement', es: 'acuerdo', fr: 'accord', de: 'Vereinbarung', pt: 'acordo', zh: '协议', ar: 'اتفاق' },
    'переговоры': { en: 'negotiation', es: 'negociación', fr: 'négociation', de: 'Verhandlung', pt: 'negociação', zh: '谈判', ar: 'تفاوض' },
    'цена': { en: 'price', es: 'precio', fr: 'prix', de: 'Preis', pt: 'preço', zh: '价格', ar: 'سعر' },
    'контракт': { en: 'contract', es: 'contrato', fr: 'contrat', de: 'Vertrag', pt: 'contrato', zh: '合同', ar: 'عقد' },
    'предложение': { en: 'proposal', es: 'propuesta', fr: 'proposition', de: 'Vorschlag', pt: 'proposta', zh: '提案', ar: 'اقتراح' },
    'встреча': { en: 'meeting', es: 'reunión', fr: 'réunion', de: 'Treffen', pt: 'reunião', zh: '会议', ar: 'اجتماع' },
    'компания': { en: 'company', es: 'empresa', fr: 'entreprise', de: 'Unternehmen', pt: 'empresa', zh: '公司', ar: 'شركة' },
    'клиент': { en: 'client', es: 'cliente', fr: 'client', de: 'Kunde', pt: 'cliente', zh: '客户', ar: 'عميل' },
    'проблема': { en: 'problem', es: 'problema', fr: 'problème', de: 'Problem', pt: 'problema', zh: '问题', ar: 'مشكلة' },
    'решение': { en: 'solution', es: 'solución', fr: 'solution', de: 'Lösung', pt: 'solução', zh: '解决方案', ar: 'حل' },
    'важный': { en: 'important', es: 'importante', fr: 'important', de: 'wichtig', pt: 'importante', zh: '重要', ar: 'مهم' },
    'я хочу': { en: 'I want', es: 'quiero', fr: 'je veux', de: 'ich möchte', pt: 'quero', zh: '我想要', ar: 'أريد' },
    'мы можем': { en: 'we can', es: 'podemos', fr: 'nous pouvons', de: 'wir können', pt: 'podemos', zh: '我们可以', ar: 'يمكننا' },
    'время': { en: 'time', es: 'tiempo', fr: 'temps', de: 'Zeit', pt: 'tempo', zh: '时间', ar: 'وقت' },
    'деньги': { en: 'money', es: 'dinero', fr: 'argent', de: 'Geld', pt: 'dinheiro', zh: '钱', ar: 'مال' },
    'работа': { en: 'work', es: 'trabajo', fr: 'travail', de: 'Arbeit', pt: 'trabalho', zh: '工作', ar: 'عمل' },
  },
  zh: {
    '你好': { en: 'hello', es: 'hola', fr: 'bonjour', de: 'hallo', pt: 'olá', ru: 'привет', ar: 'مرحبا' },
    '谢谢': { en: 'thank you', es: 'gracias', fr: 'merci', de: 'danke', pt: 'obrigado', ru: 'спасибо', ar: 'شكرا' },
    '请': { en: 'please', es: 'por favor', fr: 's\'il vous plaît', de: 'bitte', pt: 'por favor', ru: 'пожалуйста', ar: 'من فضلك' },
    '协议': { en: 'agreement', es: 'acuerdo', fr: 'accord', de: 'Vereinbarung', pt: 'acordo', ru: 'соглашение', ar: 'اتفاق' },
    '谈判': { en: 'negotiation', es: 'negociación', fr: 'négociation', de: 'Verhandlung', pt: 'negociação', ru: 'переговоры', ar: 'تفاوض' },
    '价格': { en: 'price', es: 'precio', fr: 'prix', de: 'Preis', pt: 'preço', ru: 'цена', ar: 'سعر' },
    '合同': { en: 'contract', es: 'contrato', fr: 'contrat', de: 'Vertrag', pt: 'contrato', ru: 'контракт', ar: 'عقد' },
    '提案': { en: 'proposal', es: 'propuesta', fr: 'proposition', de: 'Vorschlag', pt: 'proposta', ru: 'предложение', ar: 'اقتراح' },
    '会议': { en: 'meeting', es: 'reunión', fr: 'réunion', de: 'Treffen', pt: 'reunião', ru: 'встреча', ar: 'اجتماع' },
    '公司': { en: 'company', es: 'empresa', fr: 'entreprise', de: 'Unternehmen', pt: 'empresa', ru: 'компания', ar: 'شركة' },
    '客户': { en: 'client', es: 'cliente', fr: 'client', de: 'Kunde', pt: 'cliente', ru: 'клиент', ar: 'عميل' },
    '问题': { en: 'problem', es: 'problema', fr: 'problème', de: 'Problem', pt: 'problema', ru: 'проблема', ar: 'مشكلة' },
    '解决方案': { en: 'solution', es: 'solución', fr: 'solution', de: 'Lösung', pt: 'solução', ru: 'решение', ar: 'حل' },
    '重要': { en: 'important', es: 'importante', fr: 'important', de: 'wichtig', pt: 'importante', ru: 'важный', ar: 'مهم' },
    '我想要': { en: 'I want', es: 'quiero', fr: 'je veux', de: 'ich möchte', pt: 'quero', ru: 'я хочу', ar: 'أريد' },
    '我们可以': { en: 'we can', es: 'podemos', fr: 'nous pouvons', de: 'wir können', pt: 'podemos', ru: 'мы можем', ar: 'يمكننا' },
    '时间': { en: 'time', es: 'tiempo', fr: 'temps', de: 'Zeit', pt: 'tempo', ru: 'время', ar: 'وقت' },
    '钱': { en: 'money', es: 'dinero', fr: 'argent', de: 'Geld', pt: 'dinheiro', ru: 'деньги', ar: 'مال' },
    '工作': { en: 'work', es: 'trabajo', fr: 'travail', de: 'Arbeit', pt: 'trabalho', ru: 'работа', ar: 'عمل' },
  },
  ar: {
    'مرحبا': { en: 'hello', es: 'hola', fr: 'bonjour', de: 'hallo', pt: 'olá', ru: 'привет', zh: '你好' },
    'شكرا': { en: 'thank you', es: 'gracias', fr: 'merci', de: 'danke', pt: 'obrigado', ru: 'спасибо', zh: '谢谢' },
    'من فضلك': { en: 'please', es: 'por favor', fr: 's\'il vous plaît', de: 'bitte', pt: 'por favor', ru: 'пожалуйста', zh: '请' },
    'اتفاق': { en: 'agreement', es: 'acuerdo', fr: 'accord', de: 'Vereinbarung', pt: 'acordo', ru: 'соглашение', zh: '协议' },
    'تفاوض': { en: 'negotiation', es: 'negociación', fr: 'négociation', de: 'Verhandlung', pt: 'negociação', ru: 'переговоры', zh: '谈判' },
    'سعر': { en: 'price', es: 'precio', fr: 'prix', de: 'Preis', pt: 'preço', ru: 'цена', zh: '价格' },
    'عقد': { en: 'contract', es: 'contrato', fr: 'contrat', de: 'Vertrag', pt: 'contrato', ru: 'контракт', zh: '合同' },
    'اقتراح': { en: 'proposal', es: 'propuesta', fr: 'proposition', de: 'Vorschlag', pt: 'proposta', ru: 'предложение', zh: '提案' },
    'اجتماع': { en: 'meeting', es: 'reunión', fr: 'réunion', de: 'Treffen', pt: 'reunião', ru: 'встреча', zh: '会议' },
    'شركة': { en: 'company', es: 'empresa', fr: 'entreprise', de: 'Unternehmen', pt: 'empresa', ru: 'компания', zh: '公司' },
    'عميل': { en: 'client', es: 'cliente', fr: 'client', de: 'Kunde', pt: 'cliente', ru: 'клиент', zh: '客户' },
    'مشكلة': { en: 'problem', es: 'problema', fr: 'problème', de: 'Problem', pt: 'problema', ru: 'проблема', zh: '问题' },
    'حل': { en: 'solution', es: 'solución', fr: 'solution', de: 'Lösung', pt: 'solução', ru: 'решение', zh: '解决方案' },
    'مهم': { en: 'important', es: 'importante', fr: 'important', de: 'wichtig', pt: 'importante', ru: 'важный', zh: '重要' },
    'أريد': { en: 'I want', es: 'quiero', fr: 'je veux', de: 'ich möchte', pt: 'quero', ru: 'я хочу', zh: '我想要' },
    'يمكننا': { en: 'we can', es: 'podemos', fr: 'nous pouvons', de: 'wir können', pt: 'podemos', ru: 'мы можем', zh: '我们可以' },
    'وقت': { en: 'time', es: 'tiempo', fr: 'temps', de: 'Zeit', pt: 'tempo', ru: 'время', zh: '时间' },
    'مال': { en: 'money', es: 'dinero', fr: 'argent', de: 'Geld', pt: 'dinheiro', ru: 'деньги', zh: '钱' },
    'عمل': { en: 'work', es: 'trabajo', fr: 'travail', de: 'Arbeit', pt: 'trabalho', ru: 'работа', zh: '工作' },
  },
};

/**
 * Translates text from one language to another using a dictionary-based approach.
 * Falls back to a placeholder indicator for unmatched content.
 */
export function translateText(text: string, fromLang: string, toLang: string): string {
  if (!text || !text.trim()) return text;
  if (fromLang === toLang) return text;
  if (fromLang === 'unknown' || fromLang === 'en') return text;

  const sourceDictionary = PHRASE_DICTIONARY[fromLang];
  if (!sourceDictionary) {
    return `[Translated from ${fromLang.toUpperCase()}] ${text}`;
  }

  let translatedText = text.toLowerCase();
  let hasTranslation = false;

  // Apply phrase-level translations
  for (const [phrase, translations] of Object.entries(sourceDictionary)) {
    if (translatedText.includes(phrase.toLowerCase())) {
      const targetTranslation = translations[toLang] || translations['en'];
      if (targetTranslation) {
        translatedText = translatedText.replace(
          new RegExp(phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
          targetTranslation
        );
        hasTranslation = true;
      }
    }
  }

  if (hasTranslation) {
    return translatedText;
  }

  // Fallback: indicate translation with source language
  return `[Translated from ${fromLang.toUpperCase()}] ${text}`;
}

/**
 * Translates text to English for NLP analysis purposes.
 */
export function translateToEnglish(text: string, fromLang: string): string {
  return translateText(text, fromLang, 'en');
}
