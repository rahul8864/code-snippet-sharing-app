'use server';

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';

import { GetAllSnippetFuncArgs, GetAllSnippetsReturnType, SnippetItemType } from '../types';

export type CreateSnippetType = Prisma.Args<typeof db.snippets, 'create'>['data']

export const createSnippetAction = async (snippet: CreateSnippetType) => {
    try {
         await db.snippets.create({data: snippet})
         revalidatePath('/feed')
    } catch (error: any) {
        console.error(error)
        throw new Error(error)
    }
}

export const editSnippetAction = async (id: string, snippet: CreateSnippetType) => {
    try {
         await db.snippets.update({
            where: {
                id
            }, 
            data: snippet
         })
         
         revalidatePath('/feed')
         revalidatePath(`snippet/${id}`)
         revalidatePath(`snippet/${id}/edit`)
    } catch (error: any) {
        console.error(error)
        throw new Error(error)
    }
}

export const getAllSnippetsAction = async ({page, searchText, language, limit = 6, }: GetAllSnippetFuncArgs): Promise<GetAllSnippetsReturnType> =>  {
    try {

        const skipRecords = (page - 1) * limit;
        
        const filters: any = {
            isPublic: true,
            OR: [
                {
                    title: {
                        contains: searchText,
                        mode: 'insensitive'
                    }
                },
                {
                    description: {
                        contains: searchText,
                        mode: 'insensitive'
                    }
                }
            ]
        }         

        if(!!language) {
            filters['language'] = language
        }

        

        const records = await db.$transaction([
            db.snippets.count({
                where: filters
            }),
            db.snippets.findMany({
                where: filters, 
                include: {
                    author: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: skipRecords,
                take: limit
            })
        ])

        return {
            data: records[1],
            totalPages: Math.ceil(records[0] / limit)
        }
        
    } catch (err) {
        console.log(err)
        return {
            data: [],
            totalPages: 0
        }
    }
}

export const getAllSnippetByIdAction = async (id: string): Promise<SnippetItemType | null> =>  {
    try {
        return await db.snippets.findUnique({
         where: {
            id
         }, 
         include: {
            author: {
                select: {
                    name: true
                }
            }
         }
        })
        
    } catch (err) {
        console.log(err)
        return null
    }
}