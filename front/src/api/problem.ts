// Ошибка в формате problem details (RFC 9457). Потом заменится типом из контракта.
export type ApiProblem = {
  code: string;
  title: string;
  detail?: string;
  fieldErrors?: Record<string, string>; // поле -> сообщение под полем
};
