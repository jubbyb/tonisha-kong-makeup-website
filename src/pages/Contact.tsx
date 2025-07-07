import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
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
      await addDoc(collection(db, 'contactMessages'), {
        name,
        email,
        phone,
        subject,
        message,
        timestamp: new Date(),
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Error adding document: ', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  {
    /* <label className="input">
  <span className="label">https://</span>
  <input type="text" placeholder="URL" />
</label> */
  }
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">Contact Us</h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto bg-base-100 p-8 rounded-lg shadow-xl "
      >
        <div className="form-control mb-4">
          <label className="input w-full">
            <span className="label">Name </span>
            <input
              type="text"
              className="grow"
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
              className="grow"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-control mb-4">
          <label className="input w-full input-bordered flex items-center gap-2">
            <span className="label">Phone</span>
            <input
              type="tel"
              className="tabular-nums"
              placeholder=""
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              pattern="[0-9]*"
              minLength={10}
              maxLength={10}
              title="Must be 10 digits"
            />
          </label>
        </div>

        <div className="form-control mb-4">
          <label className="input w-full input-bordered flex items-center gap-2">
            <span className="label">Subject</span>
            <input
              type="text"
              className="grow"
              placeholder=""
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="form-control mb-4 items-center">
          <label className="textarea w-full textarea-bordered flex items-center gap-2">
            <span className="label">Message</span>
            <textarea
              className="grow textarea textarea-bordered h-24"
              placeholder=""
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </label>
        </div>
        <div className="form-control mt-6 flex justify-center">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
        {success && <div className="alert alert-success mt-4">Message sent successfully!</div>}
        {error && <div className="alert alert-error mt-4">{error}</div>}
      </form>
    </div>
  );
};

export default Contact;
