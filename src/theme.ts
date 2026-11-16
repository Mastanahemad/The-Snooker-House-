export const C = {
  bg: "#0B100D", panel: "#151D18", panel2: "#1C2820",
  gold: "#D7B56D", gold2: "#F0D99D", green: "#245B3C",
  green2: "#32764E", text: "#F5F1E7", muted: "#A9B2A8",
  line: "#2B382F", red: "#D56C62", white: "#FFFFFF"
};
export const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
