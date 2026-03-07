export function tempColor(tempC: number): string {
    if (tempC < 0)   return "#60A5FA"; // freezing – blue
    if (tempC < 10)  return "#93C5FD"; // cold – light blue
    if (tempC < 18)  return "#34D399"; // cool – green
    if (tempC < 24)  return "#FBBF24"; // mild – yellow
    if (tempC < 30)  return "#F97316"; // warm – orange
    return "#EF4444";                  // hot – red
}
