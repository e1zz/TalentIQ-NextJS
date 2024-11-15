import React from 'react';
import InputField from './InputField';
import Button from './Button';

interface SignInProps {
  onForgotPassword: () => void;
  onSignUp: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onForgotPassword, onSignUp }) => {
  return (
    <main className="flex overflow-hidden gap-5 justify-center items-center px-28 py-64 h-full text-xs max-md:px-5 max-md:py-24">
      <form className="flex overflow-hidden gap-3.5 relative flex-col justify-center items-center self-stretch px-5 py-16 my-auto rounded-2xl border border-cyan-200 border-solid backdrop-blur-2xl min-w-[240px] w-[365px]">
        <img loading="lazy" src="https://quragxfempstkztmzwtk.supabase.co/storage/v1/object/sign/Images/4023203c3c3c97f943413691479624c9.jpeg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJJbWFnZXMvNDAyMzIwM2MzYzNjOTdmOTQzNDEzNjkxNDc5NjI0YzkuanBlZyIsImlhdCI6MTczMTYyODI4MywiZXhwIjoxNzYzMTY0MjgzfQ.vr9341y73TYBr_h9ezdf6u-5OeBQd_edBcxRnEpFsL8&t=2024-11-14T23%3A51%3A22.719Z" className="object-cover absolute inset-0 size-full" alt="" />
        <h1 className="z-0 text-4xl font-bold text-center text-white">
          SignIn
        </h1>
        <InputField
          type="email"
          placeholder="user123@talentiq.com"
          aria-label="Email"
        />
        <InputField
          type="password"
          placeholder="******************"
          aria-label="Password"
        />
        <button
          type="button"
          onClick={onForgotPassword}
          className="z-0 mt-4 text-sky-500"
        >
          Forgot Password?
        </button>
        <label className="z-0 mt-4 text-neutral-400">
          <input type="checkbox" className="sr-only" />
          Remember me!
        </label>
        <Button type="submit">LogIn</Button>
        <div className="flex z-0 gap-1.5 items-start mt-4 text-xs text-center">
          <span className="text-white">Not a member?</span>
          <button type="button" onClick={onSignUp} className="text-sky-500">
            SignUp now
          </button>
        </div>
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/bf91aeebd9a357e03b1c08f1010c95071f456b5e59defcb01f4b2d67e56f81aa?placeholderIfAbsent=true&apiKey=84bf64bdfc11488b9ba599f4ea6538e2"
          alt=""
          className="object-contain absolute z-0 self-start rounded aspect-[1.06] bottom-[177px] h-[18px] left-[47px] w-[19px]"
        />
      </form>
    </main>
  );
};

export default SignIn;