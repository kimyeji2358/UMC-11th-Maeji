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
import {
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
import { Header } from "../components/layout/header";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-dvh min-w-80 bg-[#111] font-sans text-white">
      <Header />
      <Outlet />
    </div>
  ),

  notFoundComponent: () => (
    <main className="mx-auto max-w-[1200px] px-6 py-20 text-center">
      <h1 className="text-3xl font-bold">
        페이지를 찾을 수 없어요.
      </h1>
    </main>
  ),
});