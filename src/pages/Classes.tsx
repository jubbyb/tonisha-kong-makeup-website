import React, { useEffect, useState } from 'react';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../firebase';

interface ClassItem {
  id: string;
  name: string;
  description: string;
  date: string;
  price: number;
  certificate?: boolean;
  mentoring?: boolean; // add flag for 1-on-1 Mentoring
}

// 1. Add your dummy data here ...remove after you have your Firestore data working
const dummyClasses: ClassItem[] = [
  {
    id: '1',
    name: 'Beginner Makeup Basics',
    description:
      'Learn the fundamentals of makeup application, including skin prep, foundation, and natural looks.',
    date: '2025-08-10T14:00',
    price: 60,
    certificate: true,
    mentoring: false,
  },
  {
    id: '2',
    name: 'Smokey Eye Masterclass',
    description:
      'Master the art of the smokey eye with step-by-step guidance and hands-on practice.',
    date: '2025-08-17T16:00',
    price: 75,
    certificate: false,
    mentoring: true,
  },
  {
    id: '3',
    name: 'Bridal Makeup Workshop',
    description:
      'Perfect for aspiring bridal artists or brides-to-be. Covers long-lasting, flawless bridal looks.',
    date: '2025-08-24T13:00',
    price: 100,
    certificate: true,
    mentoring: true,
  },
  {
    id: '4',
    name: 'Contouring & Highlighting',
    description: 'Learn advanced contouring and highlighting techniques for all face shapes.',
    date: '2025-09-01T15:00',
    price: 80,
    certificate: false,
    mentoring: false,
  },
  {
    id: '5',
    name: 'Makeup for Photography',
    description:
      'Discover tips and tricks for makeup that looks great on camera and under studio lights.',
    date: '2025-09-08T17:00',
    price: 90,
    certificate: true,
    mentoring: false,
  },
];

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // useEffect(() => {
  //   const fetchClasses = async () => {
  //     const classesCollectionRef = collection(db, 'classes');
  //     const data = await getDocs(classesCollectionRef);
  //     setClasses(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ClassItem[]);
  //     setLoading(false);
  //   };

  //   fetchClasses();
  // }, []);

  useEffect(() => {
    // For local testing, load dummy data
    setClasses(dummyClasses);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading Classes...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">Our Classes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {classes.map((classItem, idx) => (
          <div key={classItem.id} className="card w-96 bg-base-100 shadow-sm">
            <div className="card-body">
              {idx === 0 && <span className="badge badge-xs badge-warning">Most Popular</span>}
              <div className="flex justify-between">
                <h2 className="text-3xl font-bold">{classItem.name}</h2>
                <span className="text-xl">${classItem.price}</span>
              </div>
              <ul className="mt-6 flex flex-col gap-2 text-xs">
                <li>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4 me-2 inline-block text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{classItem.description}</span>
                </li>
                <li>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4 me-2 inline-block text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Date: {new Date(classItem.date).toLocaleString()}</span>
                </li>
                <li className={classItem.certificate ? '' : 'opacity-50'}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`size-4 me-2 inline-block ${classItem.certificate ? 'text-success' : 'text-base-content/50'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className={classItem.certificate ? '' : 'line-through'}>
                    Certificate Included
                  </span>
                </li>
                <li className={classItem.mentoring ? '' : 'opacity-50'}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`size-4 me-2 inline-block ${classItem.mentoring ? 'text-success' : 'text-base-content/50'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className={classItem.mentoring ? '' : 'line-through'}>
                    1-on-1 Mentoring
                  </span>
                </li>
              </ul>
              <div className="mt-6">
                <button className="btn btn-primary btn-block">Enquire</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Classes;
