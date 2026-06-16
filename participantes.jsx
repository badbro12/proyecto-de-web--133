// ParticipantsList.jsx
import Swal from 'sweetalert2';

function ParticipantsList({ participants, onDelete }) {
  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar participante?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(id);
        Swal.fire('Eliminado', 'El participante fue eliminado', 'success');
      }
    });
  };

  return (
    <table>
      <thead>
        <tr><th>Nombre</th><th>Email</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        {participants.map(p => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>{p.email}</td>
            <td>
              <button onClick={() => handleDelete(p.id)}>Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
