// Global registry of open modals to safely handle body lock ('modal-open')
let openModalCount = 0;

export function incrementModalCount() {
  openModalCount++;
  if (openModalCount === 1) {
    document.body.classList.add('modal-open');
  }
}

export function decrementModalCount() {
  openModalCount--;
  if (openModalCount <= 0) {
    openModalCount = 0;
    document.body.classList.remove('modal-open');
  }
}
