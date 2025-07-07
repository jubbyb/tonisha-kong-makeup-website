import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Bookings: React.FC = () => {
  const location = useLocation();
  const initialService = location.state?.service?.name || '';
  const [service, setService] = useState(initialService);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // const [service, setService] = useState(serviceFromState || '');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      await addDoc(collection(db, 'bookings'), {
        name,
        email,
        service,
        date,
        message,
        timestamp: new Date(),
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setService('');
      setDate('');
      setMessage('');
    } catch (err) {
      console.error('Error adding document: ', err);
      setError('Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">Book an Appointment</h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto bg-base-100 p-8 rounded-lg shadow-xl"
      >
        <div className="form-control mb-4">
          <label className="input w-full input-bordered flex items-center gap-2">
            <span className="label">Date</span>

            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-control mb-4">
          <label className="input w-full input-bordered flex items-center gap-2">
            <span className="label">Name</span>
            <input
              type="text"
              placeholder=""
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-control mb-4">
          <label className="input w-full input-bordered flex items-center gap-2">
            <span className="label">Email</span>
            <input
              type="email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-control mb-4">
          <label className="input w-full input-bordered flex items-center gap-2">
            <span className="label">Service</span>
            <input
              type="text"
              placeholder="e.g., Bridal Makeup, Photoshoot Makeup"
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="form-control mb-4">
          <label className="textarea w-full textarea-bordered flex items-center gap-2">
            <span className="label">Message</span>
            <textarea
              className="textarea textarea-bordered h-24"
              placeholder="Any specific requests or questions?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </label>
        </div>
        <div className="form-control mt-6 flex justify-center">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Booking Request'}
          </button>
        </div>
        {success && (
          <div className="alert alert-success mt-4">Booking request submitted successfully!</div>
        )}
        {error && <div className="alert alert-error mt-4">{error}</div>}
      </form>
    </div>
  );
};

export default Bookings;
