document.querySelector('form').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = this.querySelector('input').value;
  const roles = Array.from(this.querySelector('select').selectedOptions).map(opt => opt.text);
  const list = document.querySelector('.staff-list');
  const item = document.createElement('li');
  item.textContent = `${name} – ${roles.join(', ')}`;
  list.appendChild(item);
  this.reset();
});
