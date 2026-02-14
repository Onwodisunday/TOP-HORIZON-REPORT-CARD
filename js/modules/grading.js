/**
 * grading.js
 * Handles grading logic, including CA + Exam splits
 */

export function calculateAcademicGrade(ca, exam) {
    const caScore = parseFloat(ca) || 0;
    const examScore = parseFloat(exam) || 0;
    const total = caScore + examScore;

    let grade = 'F9';
    let remark = 'FAIL';

    // Standard WAEC/NECO style grading (often used in Nigerian schools)
    if (total >= 75) { grade = 'A1'; remark = 'EXCELLENT'; }
    else if (total >= 70) { grade = 'B2'; remark = 'VERY GOOD'; }
    else if (total >= 65) { grade = 'B3'; remark = 'GOOD'; }
    else if (total >= 60) { grade = 'C4'; remark = 'CREDIT'; }
    else if (total >= 50) { grade = 'C5'; remark = 'CREDIT'; }
    else if (total >= 45) { grade = 'C6'; remark = 'CREDIT'; }
    else if (total >= 40) { grade = 'D7'; remark = 'PASS'; }
    else if (total >= 1) { grade = 'F9'; remark = 'FAIL'; } // 1-39
    else { grade = '-'; remark = '-'; } // 0 or invalid

    return { total, grade, remark };
}

export const ATTR_GRADES = ['A', 'B', 'C', 'D', 'E'];
