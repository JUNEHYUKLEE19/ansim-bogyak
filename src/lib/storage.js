const MED_KEY = "ansim_medications";
const CARE_KEY = "ansim_caregiver";

export function getMeds() {
return JSON.parse(localStorage.getItem(MED_KEY) || "[]");
}
export function saveMeds(list) {
localStorage.setItem(MED_KEY, JSON.stringify(list));
}
export function addMed(med) {
const list = getMeds();
const item = { id: Date.now(), createdAt: new Date().toISOString(), ...med };
list.push(item);
saveMeds(list);
return item;
}
export function getTodayMeds() {
return getMeds(); // MVP: 전체 표시
}

export function getCaregiver() {
return JSON.parse(localStorage.getItem(CARE_KEY) || "null");
}
export function saveCaregiver(data) {
localStorage.setItem(CARE_KEY, JSON.stringify(data));
}
