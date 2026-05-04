import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Artist {
  id: number;
  slug: string | null;
  name: string;
  bio: string | null;
  specialties: string | null;
  photo_url: string | null;
  location: string | null;
}

export default function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/artists')
      .then((r) => r.json() as Promise<Artist[]>)
      .then((data) => {
        setArtists(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load artists.');
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  if (error)
    return <div className="flex justify-center items-center min-h-screen text-error">{error}</div>;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-4xl font-bold text-center mb-2">Our Artists</h1>
      <p className="text-center text-base-content/60 mb-10">
        Choose an artist to view their profile and book an appointment.
      </p>

      {artists.length === 0 ? (
        <div className="text-center text-base-content/50 py-20">
          No artists available at this time.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow"
            >
              <figure className="h-56 overflow-hidden bg-base-200">
                {artist.photo_url ? (
                  <img
                    src={artist.photo_url}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full text-5xl text-base-content/20">
                    {artist.name.charAt(0)}
                  </div>
                )}
              </figure>
              <div className="card-body">
                <h2 className="card-title">{artist.name}</h2>
                {artist.specialties && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {artist.specialties.split(',').map((s) => (
                      <span key={s} className="badge badge-outline badge-sm">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                )}
                {artist.location && (
                  <p className="text-xs text-base-content/60 mt-1">📍 {artist.location}</p>
                )}
                {artist.bio && (
                  <p className="text-sm text-base-content/70 line-clamp-3 mt-1">{artist.bio}</p>
                )}
                <div className="card-actions justify-end mt-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/artists/${artist.slug ?? artist.id}`)}
                  >
                    View &amp; Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
