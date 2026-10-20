import * as school from "./education.js";
import * as health from "./health.js";
import * as social from "./social.js";
export function simulationCommand(s, operation, p = {}) {
  const actions = {
    "explore": () => school.exploreAptitude(s, p.subject),
    "study": () => school.studySubject(s, p.subject),
    "teacher": () => school.talkTeacher(s, p.subject),
    "school": () => school.applySchool(s, p.school),
    "assess": () => school.assessLearning(s),
    "support-plan": () => school.setLearningPlan(s, p.plan),
    "bullying": () => school.reportBullying(s, p.response),
    "exams": () => school.sitSubjectExams(s),
    "parent": () => school.discussParenting(s, p.person, p.topic),
    "health-start": () => health.startHealthRecord(s),
    "appointment": () => health.bookAppointment(s, p),
    "treatment": () => health.chooseTreatment(s, p.condition, p.treatment),
    "nutrition": () => health.setNutrition(s, p.plan),
    "habit": () => health.practiceHabit(s, p.habit),
    "rehab": () => health.injuryRehab(s, p.injury),
    "network": () => social.discoverSocialLinks(s, p.person),
    "introduction": () => social.requestFriendIntroduction(s, p.person),
    "affection": () => social.showAffection(s, p.person, p.kind),
    "promise": () => social.makeSocialPromise(s, p.person, p.kind),
    "grievance": () => social.addressGrievance(s, p.grievance),
    "plan": () => social.discussLifePlan(s, p.topic, p.choice),
    "family-intro": () => social.introduceExtendedFamily(s),
    "family-visit": () => social.visitExtendedFamily(s, p.person),
    "counselling-start": () => social.startCounselling(s),
    "counselling": () => social.attendCounselling(s),
    "ambition": () => social.supportChildAmbition(s, p.child, p.support === "yes"),
    "prenup": () => social.signPrenup(s, p.policy),
    "adult-support": () => social.supportAdultChild(s, p.child, Number(p.amount)),
  };
  if (!Object.hasOwn(actions, operation)) throw new Error("This detailed activity is unavailable.");
  return actions[operation]();
}
