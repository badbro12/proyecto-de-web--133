// ActivityForm.jsx
function ActivityForm({ onSubmit }) {
  const [form, setForm] = useState({ projectId: '', description: '', date: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    alert('Avance registrado correctamente');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Proyecto" value={form.projectId} 
             onChange={e => setForm({...form, projectId: e.target.value})}/>
      <textarea placeholder="Descripción" value={form.description}
             onChange={e => setForm({...form, description: e.target.value})}/>
      <input type="date" value={form.date}
             onChange={e => setForm({...form, date: e.target.value})}/>
      <button type="submit">Guardar</button>
    </form>
  );
}