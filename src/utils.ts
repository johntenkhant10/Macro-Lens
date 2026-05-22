export function getNutritionDayKey(timestamp: number | Date): string {
  // Get string in ET forcing 00-23 hour format consistently
  const dateStringEt = new Date(timestamp).toLocaleString("en-US", {
    timeZone: "America/New_York",
    hourCycle: "h23",
  });

  // Parse the ET string back into a JS date object. 
  // It inherits the local system's offset but precisely reflects the ET YYYY-MM-DD HH:MM
  const etDate = new Date(dateStringEt);
  
  // A nutrition day resets at 6 AM. So anything before 6 AM belongs to the previous day.
  if (etDate.getHours() < 6) {
    etDate.setDate(etDate.getDate() - 1);
  }
  
  // Format to a clean date string YYYY-MM-DD
  return `${etDate.getFullYear()}-${String(etDate.getMonth() + 1).padStart(2, '0')}-${String(etDate.getDate()).padStart(2, '0')}`;
}

export function formatNutritionDayLabel(key: string): string {
   const [y, m, d] = key.split('-').map(Number);
   const date = new Date(y, m-1, d);
   
   const todayKey = getNutritionDayKey(Date.now());
   if (key === todayKey) return "Today";
   
   const yesterdayDate = new Date();
   yesterdayDate.setDate(yesterdayDate.getDate() - 1);
   if (key === getNutritionDayKey(yesterdayDate)) return "Yesterday";
   
   return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getDayOfWeek(key: string): string {
   const [y, m, d] = key.split('-').map(Number);
   const date = new Date(y, m-1, d);
   return date.toLocaleDateString("en-US", { weekday: "short" });
}
