// import * as React from 'react'
// import { Outlet, createRootRoute } from '@tanstack/react-router'

// export const Route = createRootRoute({
//   component: RootComponent,
// })

// function RootComponent() {
//   return (
//     <React.Fragment>
//       <div>Hello "__root"!</div>
//       <Outlet />
//     </React.Fragment>
//   )
// }
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "../components/layout/header";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-dvh min-w-80 bg-[#111] font-sans text-white">
      <Header />
      <Outlet />
      <footer className="border-t border-[#333] px-6 py-8 text-center text-sm text-[#888]">
        <img
          className="mx-auto mb-3 h-4"
          src="/images/logos/tmdb-logo.svg"
          alt="TMDB 로고"
        />
        <p>
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      </footer>
    </div>
  ),

  notFoundComponent: () => (
    <main className="mx-auto max-w-[1200px] px-6 py-20 text-center">
      <h1 className="text-3xl font-bold">페이지를 찾을 수 없어요.</h1>
    </main>
  ),
});
