import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='bg-muted flex min-h-svh min-w-svw items-center flex-col justify-center gap-6 p-6 pd:p-10'>
            <div className='flex w-full max-w-sm flex-col gap-6'>
                <Link href='/' className='flex justify-center items-center gap-2 self-center font-medium'>
                    <Image
                        src='/logos/logo.svg'
                        alt='Nodebase'
                        width={30}
                        height={30}
                    />
                    Nodebase
                </Link>
                {children}
            </div>
        </div>
    )
}

export default Layout; 
