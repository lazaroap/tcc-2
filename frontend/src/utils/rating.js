// Mínimo de avaliações para exibir a média pública de um prestador.
// Abaixo disso a média não é confiável (poucas notas podem enviesar o resultado,
// inclusive por ação de concorrentes), então ocultamos a média até atingir o limite.
export const MIN_REVIEWS_FOR_RATING = 5;

export function hasEnoughReviews(count) {
  return (count || 0) >= MIN_REVIEWS_FOR_RATING;
}
