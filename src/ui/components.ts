export function statRow(label: string, value: string): string {
  return `<div class="rs"><span class="rl">${label}</span><span class="rv">${value}</span></div>`;
}

export function tagSpan(text: string, cls: string): string {
  return `<span class="tag ${cls}">${text}</span>`;
}
