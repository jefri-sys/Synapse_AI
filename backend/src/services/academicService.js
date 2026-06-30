const Subject = require('../models/Subject');
const Mark = require('../models/Mark');
const User = require('../models/User');

function getGradingType(courseName) {
  const c = (courseName || '').toUpperCase();
  if (c.includes('MBA') || c.includes('MCA') || c.includes('M.TECH') || c.includes('MTECH')) {
    return 'PG_SCALE';
  } else if (c.includes('BBA') || c.includes('BCA') || c.includes('ARTS') || c.includes('SCIENCE')) {
    return 'UG_SCALE';
  }
  return 'BTECH_SCALE';
}

const streamConfigs = {
  BTECH_SCALE: { esePassMin: 40, overallPassMin: 50 },
  PG_SCALE: { esePassMin: 45, overallPassMin: 50 }, // MBA, MCA
  UG_SCALE: { esePassMin: 40, overallPassMin: 40 }  // BBA Hons, BCA Hons
};

const PENDING_STATUSES = ['W', 'I', 'R', 'WITHHELD', 'INCOMPLETE', 'REGISTERED'];

function calculateGrade(marksPercent, gradingType, esePercent, ciePercent) {
  const config = streamConfigs[gradingType] || streamConfigs.BTECH_SCALE;

  // 1. Enforce End Semester Examination Overrides
  if (esePercent !== null && esePercent < config.esePassMin) {
    return { grade: 'F', points: 0.0 };
  }

  // 2. Enforce Overall Pass Threshold
  if (marksPercent < config.overallPassMin) {
    return { grade: 'F', points: 0.0 };
  }

  // 3. Mapped grade lookup arrays
  if (gradingType === 'PG_SCALE') {
    if (marksPercent >= 90) return { grade: 'S', points: 10.0 };
    if (marksPercent >= 85) return { grade: 'A+', points: 9.0 };
    if (marksPercent >= 80) return { grade: 'A', points: 8.5 };
    if (marksPercent >= 75) return { grade: 'B+', points: 8.0 };
    if (marksPercent >= 70) return { grade: 'B', points: 7.5 };
    if (marksPercent >= 65) return { grade: 'C+', points: 7.0 };
    if (marksPercent >= 60) return { grade: 'C', points: 6.5 };
    if (marksPercent >= 55) return { grade: 'D', points: 6.0 };
    if (marksPercent >= 50) return { grade: 'P', points: 5.5 };
    return { grade: 'F', points: 0.0 };
  } else if (gradingType === 'UG_SCALE') {
    if (marksPercent >= 90) return { grade: 'O', points: 10.0 };
    if (marksPercent >= 80) return { grade: 'A+', points: 9.0 };
    if (marksPercent >= 70) return { grade: 'A', points: 8.0 };
    if (marksPercent >= 60) return { grade: 'B+', points: 7.0 };
    if (marksPercent >= 50) return { grade: 'B', points: 6.0 };
    if (marksPercent >= 40) return { grade: 'P', points: 5.0 };
    return { grade: 'F', points: 0.0 };
  } else {
    // BTECH_SCALE
    if (marksPercent >= 90) return { grade: 'S', points: 10.0 };
    if (marksPercent >= 85) return { grade: 'A+', points: 9.0 };
    if (marksPercent >= 80) return { grade: 'A', points: 8.5 };
    if (marksPercent >= 75) return { grade: 'B+', points: 8.0 };
    if (marksPercent >= 70) return { grade: 'B', points: 7.5 };
    if (marksPercent >= 65) return { grade: 'C+', points: 7.0 };
    if (marksPercent >= 60) return { grade: 'C', points: 6.5 };
    if (marksPercent >= 55) return { grade: 'D', points: 6.0 };
    if (marksPercent >= 50) return { grade: 'P', points: 5.5 };
    return { grade: 'F', points: 0.0 };
  }
}

function getPointsFromGrade(grade, gradingType) {
  if (!grade) return 0;
  const g = grade.toUpperCase();
  if (g === 'O' || g === 'S') return 10.0;
  if (g === 'A+') return 9.0;
  
  if (gradingType === 'PG_SCALE') {
    if (g === 'A') return 8.5;
    if (g === 'B+') return 8.0;
    if (g === 'B') return 7.5;
    if (g === 'C+') return 7.0;
    if (g === 'C') return 6.5;
    if (g === 'D') return 6.0;
    if (g === 'P') return 5.5;
  } else if (gradingType === 'UG_SCALE') {
    if (g === 'A') return 8.0;
    if (g === 'B+') return 7.0;
    if (g === 'B') return 6.0;
    if (g === 'P') return 5.0;
  } else {
    // BTECH
    if (g === 'A') return 8.5;
    if (g === 'B+') return 8.0;
    if (g === 'B') return 7.5;
    if (g === 'C+') return 7.0;
    if (g === 'C') return 6.5;
    if (g === 'D') return 6.0;
    if (g === 'P') return 5.5;
  }
  return 0.0; // F, FE, Ab
}

function getPercentageFromGrade(grade) {
  if (!grade) return 0;
  const g = grade.toUpperCase();
  if (g === 'O' || g === 'S') return 95;
  if (g === 'A+') return 88;
  if (g === 'A') return 83;
  if (g === 'B+') return 78;
  if (g === 'B') return 73;
  if (g === 'C+') return 68;
  if (g === 'C') return 63;
  if (g === 'D') return 58;
  if (g === 'P') return 53;
  return 0;
}

function processSubjectMarks(subject, marksList, gradingType) {
  let explicitGrade = null;
  let eseObtained = 0;
  let eseMax = 0;
  let cieObtained = 0;
  let cieMax = 0;

  for (const mark of marksList) {
    if (mark.assessmentType === 'Final' || mark.assessmentType === 'End Semester') {
      if (mark.grade) {
        explicitGrade = mark.grade;
      } else {
        eseObtained += mark.marksObtained || 0;
        eseMax += mark.totalMarks || 0;
      }
    } else {
      cieObtained += mark.marksObtained || 0;
      cieMax += mark.totalMarks || 0;
    }
  }

  if (explicitGrade) {
    const isPending = PENDING_STATUSES.includes(explicitGrade.toUpperCase());
    return {
      ...subject,
      marksPercent: isPending ? 0 : getPercentageFromGrade(explicitGrade),
      grade: explicitGrade,
      gradePoints: isPending ? null : getPointsFromGrade(explicitGrade, gradingType),
      isPending,
      credits: subject.credits || 0,
      semester: subject.semester || 1
    };
  }

  const totalObtained = eseObtained + cieObtained;
  const totalMax = eseMax + cieMax;

  let marksPercent = 0;
  if (totalMax > 0) marksPercent = (totalObtained / totalMax) * 100;

  let esePercent = null;
  if (eseMax > 0) esePercent = (eseObtained / eseMax) * 100;

  let ciePercent = null;
  if (cieMax > 0) ciePercent = (cieObtained / cieMax) * 100;

  // If no marks have been entered at all and no explicit grade is given, it's pending
  if (totalMax === 0) {
    return {
      ...subject,
      marksPercent: 0,
      grade: 'Pending',
      gradePoints: 0,
      isPending: true,
      credits: subject.credits || 0,
      semester: subject.semester || 1
    };
  }

  const { grade, points } = calculateGrade(marksPercent, gradingType, esePercent, ciePercent);

  return {
    ...subject,
    marksPercent: totalMax > 0 ? Number(marksPercent.toFixed(2)) : 0,
    grade,
    gradePoints: points,
    isPending: false,
    credits: subject.credits || 0,
    semester: subject.semester || 1
  };
}

async function calculateCGPA(userId) {
  const user = await User.findById(userId);
  const gradingType = getGradingType(user?.course);

  const subjects = await Subject.find({ userId }).lean();
  const marks = await Mark.find({ userId }).lean();

  const processedSubjects = subjects.map(subject => {
    const subjectMarks = marks.filter(m => m.subjectId.toString() === subject._id.toString());
    return processSubjectMarks(subject, subjectMarks, gradingType);
  });

  // Group by semester
  const semesters = {};
  for (const sub of processedSubjects) {
    if (!semesters[sub.semester]) semesters[sub.semester] = { totalPoints: 0, totalCredits: 0, hasPending: false };
    
    if (sub.isPending) {
      semesters[sub.semester].hasPending = true;
    }
    
    if (sub.credits > 0 && !sub.isPending) {
      semesters[sub.semester].totalPoints += (sub.gradePoints * sub.credits);
      semesters[sub.semester].totalCredits += sub.credits;
    }
  }

  let totalCumulativePoints = 0;
  let totalCumulativeCredits = 0;
  let hasAnyPending = false;

  const semesterResults = [];
  for (const [semStr, data] of Object.entries(semesters)) {
    const semNum = Number(semStr);
    
    // Calculate SGPA for completed subjects only
    const sgpa = data.totalCredits > 0 ? data.totalPoints / data.totalCredits : 0;
    
    semesterResults.push({
      semester: semNum,
      sgpa: data.totalCredits > 0 ? Number(sgpa.toFixed(2)) : null,
      totalCredits: data.totalCredits,
      status: data.hasPending ? 'In Progress' : 'Complete'
    });

    totalCumulativePoints += data.totalPoints;
    totalCumulativeCredits += data.totalCredits;
  }

  const cgpa = totalCumulativeCredits > 0 ? totalCumulativePoints / totalCumulativeCredits : 0;
  const finalCGPA = totalCumulativeCredits > 0 ? Number(cgpa.toFixed(2)) : null;
  
  let percentage = 0;
  if (finalCGPA !== null) {
    percentage = gradingType === 'PG_SCALE' ? (finalCGPA * 10) - 3.75 : finalCGPA * 10;
    if (percentage < 0) percentage = 0;
  }

  const subjectsResult = processedSubjects.map(sub => ({
    name: sub.name,
    credits: sub.credits,
    gradePoints: sub.gradePoints,
    grade: sub.grade,
    marks: sub.marksPercent,
    semester: sub.semester
  }));

  return {
    cgpa: finalCGPA,
    percentage: Number(percentage.toFixed(2)),
    semesters: semesterResults,
    subjects: subjectsResult,
    gradingType
  };
}

function whatIfCGPA(currentSubjects, hypotheticalScores, courseName) {
  const gradingType = getGradingType(courseName);

  const hypMap = {};
  if (Array.isArray(hypotheticalScores)) {
    for (const h of hypotheticalScores) {
      hypMap[h.subjectId] = { marksObtained: h.marksObtained, totalMarks: h.totalMarks };
    }
  } else if (hypotheticalScores && typeof hypotheticalScores === 'object') {
    Object.assign(hypMap, hypotheticalScores);
  }

  const processedSubjects = currentSubjects.map(subject => {
    const subjId = subject._id?.toString() || subject.id;
    const mergedMarks = [...(subject.marks || [])];
    const hypothetical = hypMap[subjId];

    if (hypothetical) {
      const finalIndex = mergedMarks.findIndex(m => m.assessmentType === 'Final' || m.assessmentType === 'End Semester');
      if (finalIndex >= 0) {
        mergedMarks[finalIndex] = { ...mergedMarks[finalIndex], marksObtained: hypothetical.marksObtained, totalMarks: hypothetical.totalMarks };
        delete mergedMarks[finalIndex].grade;
      } else {
        mergedMarks.push({ assessmentType: 'Final', marksObtained: hypothetical.marksObtained, totalMarks: hypothetical.totalMarks });
      }
    }
    return processSubjectMarks(subject, mergedMarks, gradingType);
  });

  const semesters = {};
  for (const sub of processedSubjects) {
    if (!semesters[sub.semester]) semesters[sub.semester] = { totalPoints: 0, totalCredits: 0, hasPending: false };
    
    if (sub.isPending) {
      semesters[sub.semester].hasPending = true;
    }
    
    if (sub.credits > 0 && !sub.isPending) {
      semesters[sub.semester].totalPoints += (sub.gradePoints * sub.credits);
      semesters[sub.semester].totalCredits += sub.credits;
    }
  }

  let totalCumulativePoints = 0;
  let totalCumulativeCredits = 0;
  let hasAnyPending = false;

  for (const data of Object.values(semesters)) {
    totalCumulativePoints += data.totalPoints;
    totalCumulativeCredits += data.totalCredits;
  }

  const cgpa = totalCumulativeCredits > 0 ? totalCumulativePoints / totalCumulativeCredits : 0;
  return totalCumulativeCredits > 0 ? Number(cgpa.toFixed(2)) : null;
}

module.exports = {
  calculateGrade,
  calculateCGPA,
  whatIfCGPA,
};
