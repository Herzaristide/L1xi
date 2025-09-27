import { useParams } from 'react-router-dom';

export default function DeckDetailsPage() {
  const { id } = useParams();

  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Deck Details</h1>
      <p>Deck ID: {id}</p>
      <p>This page will show deck details and cards management.</p>
    </div>
  );
}
