// Categorias validas de prestadores de servico
const CATEGORIES = [
    'eletricista',
    'encanador',
    'pintor',
    'pedreiro',
    'marceneiro',
    'mecânico',
    'diarista',
    'jardineiro',
    'serralheiro',
    'vidraceiro',
    'gesseiro',
    'marido de aluguel',
    'dedetizador',
    'tecnico em informática',
    'outro',
];

function isValidCategory(value) {
    return CATEGORIES.includes(value.toLowerCase());
}

module.exports = { CATEGORIES, isValidCategory };
