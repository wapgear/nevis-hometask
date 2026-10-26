// Independent transcription of the assignment figures; do not derive from the API or server fixtures.
export const expectedRows = [
  ["Company", [250, 267, 284, 301, 317, 334, 350, 250, 250, 250, 250, 350]],
  ["Branch 1", [147, 157, 166, 156, 188, 201, 214, 147, 147, 147, 147, 214]],
  ["Anna Blackwood", [25, 26, 28, 31, 32, 34, 38, 27, 27, 27, 27, 38]],
  ["Existing clients", [25, 25, 26, 28, 31, 32, 34, 25, 25, 25, 25, 34]],
  ["New organic", [0, 1, 1, 1, 0, 2, 2, 1, 1, 1, 1, 2]],
  ["New paid", [0, 0, 1, 1, 2, 1, 0, 2, 1, 1, 1, 2]],
  ["James Walker", [12, 13, 14, 14, 15, 15, 16, 12, 12, 12, 12, 17]],
  ["Maria Gutierrez", [36, 39, 41, 22, 46, 48, 51, 35, 35, 35, 35, 52]],
  ["Robert Chen", [42, 43, 46, 47, 51, 55, 58, 41, 41, 41, 41, 54]],
  ["Sarah Smith", [32, 36, 37, 42, 44, 49, 53, 32, 32, 32, 32, 53]],
  ["Branch 2", [76, 80, 84, 87, 90, 92, 94, 75, 75, 75, 75, 91]],
  ["Branch 3", [27, 30, 34, 36, 39, 41, 42, 28, 28, 28, 28, 45]],
] as const;

export const expectedScopeLabels: Record<string, string> = {
  Company: "Company: Company",
  "Branch 1": "Branch: Branch 1",
  "Branch 2": "Branch: Branch 2",
  "Branch 3": "Branch: Branch 3",
  "Anna Blackwood": "Employee: Anna Blackwood",
  "James Walker": "Employee: James Walker",
  "Maria Gutierrez": "Employee: Maria Gutierrez",
  "Robert Chen": "Employee: Robert Chen",
  "Sarah Smith": "Employee: Sarah Smith",
  "Existing clients": "Channel: Existing clients",
  "New organic": "Channel: New organic",
  "New paid": "Channel: New paid",
};
