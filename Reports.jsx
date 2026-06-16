// Reports.jsx
function Reports({ api }) {
  const [results, setResults] = useState([]);

  const searchByState = async (state) => {
    const res = await api.get(`/reports?state=${state}`);
    setResults(res.data);
  };

  return (
    <div>
      <input placeholder="Estado" onBlur={e => searchByState(e.target.value)} />
      <table>
        <thead><tr><th>Proyecto</th><th>Estado</th></tr></thead>
        <tbody>
          {results.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.state}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
