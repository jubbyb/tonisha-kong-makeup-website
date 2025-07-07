import React from 'react';

const About: React.FC = () => {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex flex-col items-center text-center">
        <div className="max-w-xl w-full">
          <h1 className="text-5xl font-bold mb-6">About Tonisha Kong</h1>
          <div className="flex flex-col items-center gap-4">
            {/* Main Portrait */}
            <div className="avatar">
              <div className="w-40 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 mx-auto">
                <img
                  src="https://cdn.shoutoutmiami.com/wp-content/uploads/2023/11/c-PersonalTonishaKong__IMG0118_1697819890726.jpeg"
                  alt="Tonisha Kong"
                />
              </div>
            </div>
            {/* About Text */}
            <p className="py-4 text-base leading-relaxed">
              Hi, I'm Tonisha Kong, a passionate makeup artist based in Jamaica.
              <br />
              <br />
              My creative journey began in childhood, surrounded by a supportive family who
              encouraged my artistic side. I was always drawn to art and music, teaching myself
              piano at age four and excelling in art classes. While I initially pursued Zoology at
              university with plans to become a veterinarian, my love for creativity never faded.
              <br />
              <br />
              During university, I discovered my passion for makeup—experimenting with bold looks on
              myself and friends. What started as a hobby soon became a calling. After university, I
              decided to follow my heart and pursue makeup artistry professionally. My family,
              especially my mother and big sister, supported me every step of the way. My sister
              even sent me to makeup school in Manhattan, and I've had the privilege of training
              with renowned artists, including Rihanna's makeup artist.
              <br />
              <br />
              My makeup style is all about enhancing natural beauty, not masking it. I believe in
              making people feel confident and comfortable in their own skin. It's a privilege to
              help clients see their own beauty and to be trusted with their transformation.
              <br />
              <br />
              The journey hasn't always been easy—there were long days, sleepless nights, and
              moments of self-doubt. But I've learned that the only real obstacle is yourself. With
              positivity and perseverance, you can achieve what you truly want.
              <br />
              <br />
              Today, my mission is to help every client feel beautiful without hiding who they are.
              Makeup is more than a mask—it's a tool for confidence and self-expression. I'm
              grateful for the trust my clients place in me and for the unwavering support of my
              family.
              <br />
              <br />
              <strong>Special thanks</strong> to my mom and big sister for their constant
              encouragement and love. I wouldn't be where I am today without them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
