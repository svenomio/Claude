// VEC – Ausgangs-Organigramm.
// Struktur: jede Einheit hat einen Namen, optional direkte Mitglieder
// ("members") und optional Unter-Einheiten ("children").
// Einheiten mit leerem members-Array sind aktuell wirklich vakant (bestätigt).
// "Stephan" (PV Mission) ist bewusst eine andere Person als "Stefan".

const VEC_ORG_CHART = {
  name: "VEC",
  members: [],
  children: [
    { name: "Geschäftsführung", members: ["Martin"] },
    { name: "Controlling & Energy Chapter", members: ["Annina"] },
    { name: "Portfoliomanagement & Beschaffung", members: [] },
    { name: "Controlling & Risiko", members: [] },
    { name: "Assistenz der Geschäftsführung", members: ["Lisa", "Monika"] },
    { name: "Customer Communications", members: ["Barbara", "Jela"] },
    { name: "VEC Corporate Development", members: ["Ana Sofia"] },
    { name: "Innovation", members: ["Gerhard"] },
    {
      name: "IT & Digital Chapter",
      members: [],
      children: [
        { name: "Geschäftsführung", members: [] },
        {
          name: "IT Delivery Teams / Applikationsmanagement",
          members: [
            "Stefan", "Philippos", "Gerald", "Clemens", "Martin", "Nicolas",
            "Stefan", "Marco", "Jeannine", "Daniel", "Nadine", "Hynek",
            "Sven", "Christian", "Christoph",
          ],
        },
        {
          name: "Enterprise Architecture, Governance, IT-Security und Requirements",
          members: [],
        },
      ],
    },
    { name: "Commercial Chapter", members: ["Stefan"] },
    { name: "B2B Sales", members: ["Susanna", "Jasmin", "Matthias", "Stefan"] },
    { name: "Projekt- und Portfoliomanagement", members: ["Anzhela", "Evelyn"] },
    { name: "Data Science", members: ["Ilka", "André", "Karolina", "Noelle", "Katharina"] },
    {
      name: "Abwicklung & Prozesse",
      members: [
        "Teresa", "Phillip", "Tobias", "Kaspar", "Daniel", "Anne", "Gaelle",
        "Hannes", "Doris",
      ],
    },
    { name: "PV Mission", members: ["Marina", "Stephan", "Christina"] },
  ],
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { VEC_ORG_CHART };
}
