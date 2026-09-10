// VEC – Ausgangs-Organigramm.
// Struktur: jede Einheit hat einen Namen, optional direkte Mitglieder
// ("members") und optional Unter-Einheiten ("children").
// Einheiten mit leerem members-Array sind aktuell wirklich vakant (bestätigt).
// "Stephan" (PV Mission) ist bewusst eine andere Person als "Stefan".
//
// "category" (nur auf oberster Ebene) steuert, in welcher Ebene die Einheit
// im Organigramm angezeigt wird: "leadership" (Geschäftsführung, ganz oben),
// "chapter" (die Chapters, darunter), sonst "team" (übrige Bereiche, unten).
// Bleibt auch nach Umbenennungen stabil, weil an der Einheit selbst hängt,
// nicht am (veränderlichen) Namen.

const VEC_ORG_CHART = {
  name: "VEC",
  members: [],
  children: [
    { name: "Geschäftsführung", category: "leadership", members: ["Martin"] },
    { name: "Controlling & Energy Chapter", category: "chapter", members: ["Annina"] },
    { name: "Portfoliomanagement & Beschaffung", category: "team", members: [] },
    { name: "Controlling & Risiko", category: "team", members: [] },
    { name: "Assistenz der Geschäftsführung", category: "team", members: ["Lisa", "Monika"] },
    { name: "Customer Communications", category: "team", members: ["Barbara", "Jela"] },
    { name: "VEC Corporate Development", category: "team", members: ["Ana Sofia"] },
    { name: "Innovation", category: "team", members: ["Gerhard"] },
    {
      name: "IT & Digital Chapter",
      category: "chapter",
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
    { name: "Commercial Chapter", category: "chapter", members: ["Stefan"] },
    { name: "B2B Sales", category: "team", members: ["Susanna", "Jasmin", "Matthias", "Stefan"] },
    { name: "Projekt- und Portfoliomanagement", category: "team", members: ["Anzhela", "Evelyn"] },
    { name: "Data Science", category: "team", members: ["Ilka", "André", "Karolina", "Noelle", "Katharina"] },
    {
      name: "Abwicklung & Prozesse",
      category: "team",
      members: [
        "Teresa", "Phillip", "Tobias", "Kaspar", "Daniel", "Anne", "Gaelle",
        "Hannes", "Doris",
      ],
    },
    { name: "PV Mission", category: "team", members: ["Marina", "Stephan", "Christina"] },
  ],
};
