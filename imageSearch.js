import ImageClient from 'google-images';
const imageClient = new ImageClient(process.env.CSE_ID, process.env.GOOGLE_API_KEY);

const ImageSearch = (client, msg, args) => {
    let searchString = null;
    let imgNum = 1;

    if (!isNaN(parseInt(args[0]))) {
        searchString = args.slice(1).join(' ');
        imgNum = Math.min(Math.max(parseInt(args[0]), 1), 10);
    } else {
        searchString = args.join(' ');
    }

    imageClient.search(searchString)
    .then(images => {
        let i = 0;
        images.some(image => {
            msg.channel.sendMessage(image.url);
            return ++i == imgNum;
        });
    }).catch(console.err);
}

export default ImageSearch;
