/**
 * parser.js -> data.js
 * Handles data structure and validation for the Report Card
 */

export function createSubject(name, score) {
    const numScore = parseFloat(score);
    return {
        name: name || '',
        score: isNaN(numScore) ? 0 : numScore,
        valid: !isNaN(numScore) && name.trim() !== ''
    };
}

export function validateStudent(student) {
    return {
        name: student.name || '',
        id: student.id || '',
        className: student.className || '',
        term: student.term || ''
    };
}
