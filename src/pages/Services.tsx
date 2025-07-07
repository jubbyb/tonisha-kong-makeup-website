import React, { useEffect, useState } from 'react';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../firebase';
// import { useNavigate } from "react-router-dom";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

// 1. Add your dummy data here ...remove after you have your Firestore data working
const dummyServices: Service[] = [
  {
    id: '1',
    name: 'Bridal Makeup',
    description: 'Professional bridal makeup for your special day, including trial session.',
    price: 250,
  },
  {
    id: '2',
    name: 'Event Glam',
    description: 'Full-face makeup for parties, proms, and special occasions.',
    price: 120,
  },
  {
    id: '3',
    name: 'Makeup Lesson',
    description: 'One-on-one makeup lesson tailored to your needs and skill level.',
    price: 90,
  },
  {
    id: '4',
    name: 'Photoshoot Makeup',
    description: 'Camera-ready makeup for photoshoots and media appearances.',
    price: 150,
  },
  {
    id: '5',
    name: 'Natural Look',
    description: 'Subtle, natural makeup for everyday confidence.',
    price: 70,
  },
  {
    id: '6',
    name: 'Group Class',
    description: 'Group makeup class for friends or team building events.',
    price: 200,
  },
];

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // <-- Add phone state
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // // Uncomment the following code to fetch data from Firestore
  // useEffect(() => {
  //   const fetchServices = async () => {
  //     const servicesCollectionRef = collection(db, 'services');
  //     const data = await getDocs(servicesCollectionRef);
  //     setServices(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Service[]);
  //     setLoading(false);
  //   };

  //   fetchServices();
  // }, []);

  // 2. Use dummy data instead of Firestore
  useEffect(() => {
    setTimeout(() => {
      setServices(dummyServices);
      setLoading(false);
    }, 500); // simulate loading
  }, []);

  const handleBookNow = (service: Service) => {
    setSelectedService(service);
    setShowModal(true);
    setSuccess(false);
    setName('');
    setEmail('');
    setPhone(''); // <-- Reset phone
    setDate('');
    setMessage('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedService(null);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would send booking data to Firestore or your backend
    setSuccess(true);
    setTimeout(() => {
      setShowModal(false);
    }, 1500);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading Services...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">Our Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <div key={service.id} className="card bg-base-100 w-96 shadow-sm">
            <figure>
              <img
                src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
                alt={service.name}
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">
                {service.name} - ${service.price}
              </h2>
              <p>{service.description}</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary" onClick={() => handleBookNow(service)}>
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <form method="dialog">
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </form>
            <h3 className="font-bold text-lg mb-4 text-center">Book {selectedService?.name}</h3>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="form-control">
                <label className="input w-full input-bordered flex items-center gap-2">
                  <span className="label">Name</span>

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

              <div className="form-control">
                <label className="input w-full input-bordered flex items-center gap-2">
                  <span className="label">Service</span>

                  <input
                    type="text"
                    className="grow"
                    value={selectedService?.name || ''}
                    disabled
                    readOnly
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="input w-full input-bordered flex items-center gap-2">
                  <span className="label">Date</span>

                  <input
                    type="datetime-local"
                    className="grow"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="form-control">
                <label className="textarea w-full input-bordered flex items-center gap-2">
                  <span className="label">Message</span>

                  <textarea
                    className="grow"
                    placeholder="Additional details (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  ></textarea>
                </label>
              </div>
              <div className="form-control flex justify-center mt-4">
                <button type="submit" className="btn btn-primary">
                  Confirm Booking
                </button>
              </div>
              {success && (
                <div className="alert alert-success mt-4 text-center">Booking submitted!</div>
              )}
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default Services;
