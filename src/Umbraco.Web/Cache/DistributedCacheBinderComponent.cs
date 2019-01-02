﻿using Umbraco.Core;
using Umbraco.Core.Components;
using Umbraco.Core.Composing;

namespace Umbraco.Web.Cache
{
    /// <summary>
    /// Installs listeners on service events in order to refresh our caches.
    /// </summary>
    [RuntimeLevel(MinLevel = RuntimeLevel.Run)]
    [RequiredComponent(typeof(IUmbracoCoreComponent))] // runs before every other IUmbracoCoreComponent!
    public class DistributedCacheBinderComponent : UmbracoComponentBase, IUmbracoCoreComponent
    {
        public override void Compose(Composition composition)
        {
            composition.Container.RegisterSingleton<IDistributedCacheBinder, DistributedCacheBinder>();
        }

        public void Initialize(IDistributedCacheBinder distributedCacheBinder)
        {
            distributedCacheBinder.BindEvents();
        }
    }
}