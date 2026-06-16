// Dashboard.jsx
import { Bar } from 'react-chartjs-2';

function Dashboard({ stats }) {
  const data = {
    labels: Object.keys(stats.projectsByState),
    datasets: [{
      label: 'Proyectos por estado',
      data: Object.values(stats.projectsByState),
      backgroundColor: 'rgba(75,192,192,0.6)',
    }]
  };

  return (
    <div>
      <div className="cards">
        <div>Total proyectos: {stats.totalProjects}</div>
        <div>Activos: {stats.activeProjects}</div>
        <div>Participantes: {stats.totalParticipants}</div>
      </div>
      <Bar data={data} />
    </div>
  );
}
