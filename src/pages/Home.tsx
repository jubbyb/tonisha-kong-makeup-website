import React from 'react';
import { useNavigate } from 'react-router-dom';

const carouselImages = [
  'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-PersonalTonishaKong__IMG0118_1697819890726.jpeg',
  'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__378130F60C3E4EF8B946227AE0549CCA_1697820629968.jpg',
  'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__AndieJamaica41_1697820629969.jpeg',
  'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__IMG2958_1697820629959.jpg',
  'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__IMG2970_1697820629934.jpg',
  'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__IMG2124_1697820629963.jpg',
  'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__JIK7515_1697820629912.jpg',
  'https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-TonishaKong__BYDC12_1697820629918.jpg',
];

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div
        className="hero min-h-screen"
        style={{
          backgroundImage:
            'url(https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-PersonalTonishaKong__IMG0118_1697819890726.jpeg)',
        }}
      >
        <div className="hero-overlay"></div>
        <div className="hero-content text-neutral-content text-center">
          <div className="max-w-md">
            <h1 className="mb-5 text-5xl font-bold">Transforming Beauty Through Artistry</h1>
            <p className="mb-5">
              Experienced makeup artist dedicated to creating stunning looks for any occasion.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/services')}>
              Book Now
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-8">
        <div className="carousel w-full max-w-6xl rounded-lg shadow-lg" style={{ maxHeight: 600 }}>
          {carouselImages.map((img, idx) => (
            <div
              key={img}
              id={`slide${idx + 1}`}
              className="carousel-item relative w-full"
              style={{ maxHeight: 600 }}
            >
              <img
                src={img}
                className="w-full object-cover object-bottom max-h-600"
                alt={`Tonisha Kong ${idx + 1}`}
              />
              <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
                <a
                  href={`#slide${idx === 0 ? carouselImages.length : idx}`}
                  className="btn btn-circle"
                >
                  ❮
                </a>
                <a
                  href={`#slide${idx + 2 > carouselImages.length ? 1 : idx + 2}`}
                  className="btn btn-circle"
                >
                  ❯
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
