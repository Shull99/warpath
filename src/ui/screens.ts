/** Show a screen by id, hide all others */
export function showScreen(id: string): void {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id)!.classList.add('active');
  window.scrollTo(0, 0);
}
