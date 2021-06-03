import axios, { AxiosResponse } from 'axios'

export enum HttpMethod {
  Get = 'get',
  Post = 'post',
  Delete = 'delete'
}

interface HttpRequest {
  url: string
  method: HttpMethod
  body?: Object
}

export async function sendRequest<T>({ url, method, body }: HttpRequest): Promise<T> {
  let response: AxiosResponse<any>
  try {
    response = await axios[method](url, body)
  } catch (error) {
    console.log(`${error.response.status} ${error.response.statusText}`)
    return error.response.data
  }
  return response.data as T
}
