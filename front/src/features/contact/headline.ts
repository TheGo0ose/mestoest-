// В ТЗ у запроса на связь нет поля «тема», поэтому заголовок берём из начала сообщения:
// не длиннее 60 символов, обрезаем по границе слова.
export function headline(message: string, max = 60): string {
  const text = message.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 20 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:!?-]+$/, '')}…`;
}
