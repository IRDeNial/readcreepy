//(function(){
    var savedScrollPosition = 0;

    const _dateSort = (a,b) => {
        let _a = Number(a.time);
        let _b = Number(b.time);
        return _a-_b;
    };

    const validateEnvironment = () => {
        if (!('fetch' in window)) return false;
        return true;
    };

    const clearSingleStory = () => {
        let singleStory = document.querySelector('#singleStory .story');
        if(singleStory) {
            document.querySelector('#singleStory').removeChild(singleStory);
        }
    };

    const loadSingleStory = (storyid) => {
        return fetch('content/' + storyid + '.json',{
            headers: new Headers({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        }).then((response) => {
            return response.json();
        }).then((story) => {
            clearSingleStory();

            let storyElement = document.createElement('div');
            storyElement.classList.add('story');
            let datePosted = new Date(story.time/1000);
            storyElement.innerHTML = `
                <div class="row">
                    <div class="col-xs-12">
                        <div class="title">` + story.title + `</div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <span class="author detail">Author: ` + story.author + `</span>
                        <span class="detail">&nbsp;|&nbsp;</span>
                        <span class="date detail">Date: ` + datePosted.toLocaleDateString() + `</span>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <a class="link detail" href="https://np.reddit.com"` + story.url + `">Original:&nbsp;` + story.url + `</a>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <button class="returnButton" type="button">Return To Story List</button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <div class="content">` + fixURLs(story.body) + `</div>
                    </div>
                </div>
            `;
            document.querySelector('#singleStory').appendChild(storyElement);
        }).then(() => {
            window.scrollTo(0,0);
            document.querySelector('#singleStory').classList.remove('hidden');
            document.querySelector('#storyList').classList.add('hidden');
        });
    };

    const loadStoryList = () => {
        fetch('content/index.json',{
            headers: new Headers({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
        }).then((response) => {
            return response.json();
        }).then((response) => {
            return response.stories.sort(_dateSort).reverse();
        }).then((stories) => {
            for(let story of stories) {
                let storyElement = document.createElement('div');
                storyElement.classList.add('story');
                let datePosted = new Date(story.time/1000);

                storyElement.innerHTML = `
                    <a href="#` + story.id + `" class="storyLink" data-storyid="` + story.id + `"></a>
                    <div class="row">
                        <div class="col-xs-12">
                            <div class="title">` + story.title + `</div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-xs-12">
                            <span class="author detail">Author: ` + story.author + `</span>
                            <span class="detail">&nbsp;|&nbsp;</span>
                            <span class="date detail">Date: ` + datePosted.toLocaleDateString() + `</span>
                        </div>
                    </div>
                `;

                document.querySelector('#storyList').appendChild(storyElement);
            }
        });
    };

    const fixURLs = (content) => {
        content = content.replace(/\"(https?\:)?\/\/((old|www|np)\.)?(reddit\.com\/r\/nosleep\/comments|redd\.it)\/([a-zA-Z0-9]+)(.*?)\>/gim,'"#$5">Link:&nbsp;');
        return content;
    };

    const isHashSet = () => {
        return !(window.location.hash == "");
    };

    const returnButtonHandler = (e) => {
        if(e.target && e.target.classList.contains('returnButton')) {
            document.querySelector('#singleStory').classList.add('hidden');
            document.querySelector('#storyList').classList.remove('hidden');
            window.scrollTo(0,savedScrollPosition);
            window.location.hash = "";
        }
    };

    const singleStoryButtonHandler = (e) => {
        if(e.target && e.target.classList.contains('storyLink')) {
            savedScrollPosition = window.scrollY;
            loadSingleStory(e.target.dataset.storyid);
        }
    };

    const singleStoryHashChangeHandler = () => {
        loadSingleStory(window.location.hash.replace('#',''));
    };

    const eventListeners = () => {
        document.addEventListener('click',singleStoryButtonHandler);
        document.addEventListener('click',returnButtonHandler);
        window.onhashchange = singleStoryHashChangeHandler;
    };

    if(!validateEnvironment()) {
        throw Error("Invalid environment. Try a different browser");
    }

    loadStoryList();
    if(isHashSet()) {
        loadSingleStory(window.location.hash.replace('#',''));
    }
    eventListeners();
//})();